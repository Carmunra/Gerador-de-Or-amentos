import httpx
import logging

logger = logging.getLogger(__name__)

class BrasilApiService:
    def __init__(self):
        self.base_url = "https://brasilapi.com.br/api/cnpj/v1"

    async def get_company_data(self, cnpj: str) -> dict:
        """
        Consome a BrasilAPI de forma assíncrona para validar o cliente
        """
        clean_cnpj = "".join(filter(str.isdigit, str(cnpj)))

        async with httpx.AsyncClient() as client:
            try:
                logger.info(f"Consultando BrasilAPI para o CNPJ: {clean_cnpj}")
                response = await client.get(f"{self.base_url}/{clean_cnpj}", timeout=10.0)

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "razao_social": data.get("razao_social"),
                        "uf": data.get("uf")
                    }

                logger.warning(f"CNPJ {clean_cnpj} não encontrado (Status {response.status_code})")
                return None

            except httpx.TimeoutException:
                logger.error("Timeout ao conectar com a BrasilAPI")
                return None

            except Exception as e:
                logger.error(f"Erro inesperado na BrasilAPI: {str}")
                return None