from fastapi import FastAPI, HTTPException
from app.models.summary import Summary, SummaryResponse
from app.services.BrasilApiServices import BrasilApiService
from sqlalchemy.orm import Session
from app.database import get_db, engine, Base
from app.models import db_models
import logging

#Configurando de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Gerenciado de Proposta API",
    description="Automação comercial com validação de CNPJ e cálculo de DIFAL",
    version="1.0.0",
)

#Instanciamos o service uma única vez (Singleton-like)
service = BrasilApiService()

@app.post("/proposta", response_model=SummaryResponse, tags=["Business"])
async def criar_proposta(payload: Summary):
    try:
        #1. Automação: Busca dados completos via BrasilAPI
        company_info = await service.get_company_data(payload.client.cnpj)

        if not company_info:
            raise HTTPException(status_code=400, detail="CNPJ não encontrado ou erro na BrasilAPI")

        #2. Autocorreção: Nome e Estado vêm da fonte oficial
        payload.client.state = company_info["uf"]
        payload.client.name = company_info["razao_social"].title()

        #3. Aplica o imposto baseado na UF corrigida
        payload.apply_tax_logic()

        def format_currency(value: float) -> str:
            return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        logger.info(f"Dados corrigidos para: {payload.client.name} - {payload.client.state}")

        return SummaryResponse(
            sku=payload.sku,
            client_name=payload.client.name,
            state=payload.client.state,
            items_count=len(payload.products),
            total_price=payload.total_price,
            total_price_formatted=format_currency(payload.total_price),
        )
    except Exception as e:
        logger.error(f"Falha na proposta: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro no processamento: {str(e)}")

@app.get("/health", tags=["Infrastructure"])
async def health_check():
    return {"status": "online", "version":"1.0.0"}