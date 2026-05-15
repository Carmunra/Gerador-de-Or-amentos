import pandas as pd

class ProductService:
    def __init__(self, sheet_path: str):
        #Carrega a planilha para a memória (ROI de performance)
        self.df = pd.read_excel(sheet_path)

    def get_product_bu_code(self, code: str):
        """
        Busca na planilha o produto pelo código.
        Retorna: Nome, Foto (URL), preço e descritivo.
        """
        product = self.df.loc[self.df['codigo'] == code]
        if not product.empty:
            return product.to_dict(orient='records')[0]
        return None

    

