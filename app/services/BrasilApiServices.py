import httpx
from typing import Optional, Dict

class BrasilApiService:
    def __init__(self):
        self.base_url = "https://brasilapi.com.br/api/cnpj/v1"

    async def get_company_data(self, cnpj: str) -> Optional[Dict[str, str]]:
        """Busca dados cadastrais completos do CNPJ na BrasilAPI"""
        clean_cnpj = "".join(filter(str.isdigit, str(cnpj)))

        #A URL correta é a base + / + cnpj
        url = f"{self.base_url}/{clean_cnpj}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=10.0)

                if response.status_code == 200:
                    data = response.json()
                    return{
                        "uf": data.get("uf"),
                        "razao_social": data.get("razao_social")
                    }
                return None
            except Exception as e:
                #Em produção, usariamos logger.error aqui
                print(f"Erro na conexão com BrasilAPI: {e}")
                return None