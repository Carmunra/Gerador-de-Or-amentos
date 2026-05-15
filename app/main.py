import shutil
import os
from typing import List
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, staticfiles
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.staticfiles import StaticFiles
from app.models.db_models import ProductModel
from app.database import get_db
from app.models.summary import Summary, SummaryResponse
from app.services.BrasilApiServices import BrasilApiService
from sqlalchemy.future import select
from fastapi.middleware.cors import CORSMiddleware

#Constantes de Documentação
API_DESCRIPTION = """
### Gerenciador de Propostas Alfalux
API para automação comercial que realiza:
* **Validação de CNPJ**: Consulta direta na base da BrasilAPI.
* **Cálculo de Impostos**: Lógica de DIFAL baseada na UF do cliente.
* **Persistência**: Armazenamento seguro de orçamentos.
"""

app = FastAPI(
    title="Gerenciado de Proposta API",
    description=API_DESCRIPTION,
    version="1.0.0",
    contact={
        "name": "Equipe de Desenvolvimento Alfalux",
        "email": "dev@alfalux.com.br",
    }
)

#Instanciamos o service uma única vez (Singleton-like)
service = BrasilApiService()

@app.post(
    "/proposta",
    response_model=SummaryResponse,
    tags=["Business Logic"],
    summary="Cria uma nova proposta comercial",
    description="Recebe os itens e o CNPJ, valida os dados na BrasilAPI e calcula os impostos automaticamente."
)

async def criar_proposta(
        sku_proposta: int,
        cnpj_cliente: str,
        codigos_produtos: List[str], #Você enviar ex: ["001", "002"]
        db: AsyncSession = Depends(get_db) #Injeção pronta para persistência
):
    try:
        #1. Automação: Busca dados completos via BrasilAPI
        company_info = await service.get_company_data(cnpj_cliente)

        if not company_info:
            raise HTTPException(status_code=400, detail="CNPJ não encontrado ou erro na BrasilAPI")

        #2. Busca os produtos no Banco de Dados
        result = await db.execute(select(ProductModel).where(ProductModel.code.in_(codigos_produtos)))
        db_products = result.scalars().all()

        #3. Lógica de Impostos (Simulando o cálculo do DIFAL)
        # Aqui pegamos o UF da BrasilAPI e aplicamos a lógica que estava no Summary
        state_uf = company_info["uf"]
        raw_total = sum(p.price for p in db_products)

        # TODO: Integrar com sua TaxTable/Strategy aqui
        # Por enquanto, usaremos o valor base para fechar o fluxo
        total_com_imposto = raw_total

        def format_currency(value: float) -> str:
            return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        return SummaryResponse(
            sku=sku_proposta,
            client_name=company_info["razao_social"].title(),
            state=state_uf,
            items_count=len(db_products),
            total_price=total_com_imposto,
            total_price_formatted=format_currency(total_com_imposto),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")

@app.get("/health", tags=["Infrastructure"])
async def health_check():
    return {"status": "online", "version":"1.0.0"}

# --- ROTAS DE PRODUTO (CATÁLOGO) ---

#1. Configurar onde as imagens serão salvas
UPLOAD_DIR = "app/static/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

#2. Servir os arquivos estáticos (para que o navegador e o PDF acessem a imagem)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.post("/products", tags=["Catalog"], summary="Cadastra um novo produto no sistema")
async def cadastrar_produto(
        code: str = Form(...),  #Mudamos para Form para aceitar arquivos
        name: str = Form(...),
        description: str = Form(...), #Campo de descrição
        price: float = Form(...),
        image: UploadFile = File(...), #O arquivo físico
        db: AsyncSession = Depends(get_db)
):
    """
    Cadastra o produto que será usado na Etapa 3 da proposta.
    """
    try:
        #Salvar o aruiqvo no disco
        file_extesion = image.filename.split(".")[-1]
        file_name = f"{code}.{file_extesion}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        #Salva no Banco (Usando o caminho da imagem)
        new_product = ProductModel(
            code=code,
            name=name,
            description=description,
            price=price,
            image_url=f"static/products/{file_name}", #URL relativa para o sistema
        )

        db.add(new_product)
        await db.commit()

        return {"status": "sucesso", "message": f"Produto {code} - {name} cadastrado com sucesso!"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao cadastrar {str(e)}")

@app.get("/products/{code}", tags=["Catalog"], summary="Busca do produto pelo código (SKU)")
async def buscar_produto(code: str, db: AsyncSession = Depends(get_db)):
    """
    Utilizado na Etapa 3.1 para trazer foto e descritivo manualmente.
    """
    result = await db.execute(select(ProductModel).where(ProductModel.code == code))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado no catálogo")

    return product

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #Permite que o front do Lovable acesse o back
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/company/{cnpj}", tags=["External API"])
async def get_company(cnpj: str):
    data = await service.get_company_data(cnpj)
    if not data:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return data