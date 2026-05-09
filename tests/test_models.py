import pytest
from pydantic import ValidationError
from app.models import Client, Product, Summary


def test_client_invalid_cnpj_should_falid():
    with pytest.raises(ValidationError) as excinfo:
        Client(name="Empresa Teste", cnpj="ABC12345678901", state="SP")
    assert "CNPJ deve conter exatamente 14 números" in str(excinfo.value)

def test_product_negative_price_should():
    with pytest.raises(ValidationError) as excinfo:
        Product(name="Aurus", price=-100.0, category="Spot")
    assert "greater than 0" in str(excinfo.value)

def test_client_invalid_state_should():
    with pytest.raises(ValidationError):
        Client(name="Teste", cnpj="12345678000199", state="XYZ")

def test_tax_calculation_sp_to_sp():
    """Valida que venda inter não tem acréscimo de DIFAL (SaneStateTax)"""
    client = Client(name="Cliente SP", cnpj="12345678000199", state="SP")
    p1 = Product(name="Aurus", price=100.0, category="Spot")

    summary = Summary(sku=1, client=client, products=[p1], origin_state="SP")
    total = summary.apply_tax_logic()

    assert total == 100.0

def test_tax_calculation_sp_to_rj_difal():
    """Valida acréscimo de 7% para vendas interestaduais (DIFALGenericTax)"""
    client = Client(name="Cliente RJ", cnpj="12345678000199", state="RJ")
    p1 = Product(name="Aurus", price=100.0, category="Spot")

    summary = Summary(sku=2, client=client, products=[p1], origin_state="SP")
    total = summary.apply_tax_logic()

    #100.0 * 1.07 = 107.0
    assert total == 107.0

def test_summary_response_mapping():
    """Valida se conseguimos mapear para o ResponseModel corretamente"""
    from app.models.summary import SummaryResponse
    client = Client(name="Empresa X", cnpj="12345678000199", state="MG")
    p1 = Product(name="Aurus", price=100.0, category="Spot")

    summary = Summary(sku=3, client=client, products=[p1])
    summary.apply_tax_logic()

    #Simulando a criação do ResponseModel que usaremos no FastAPI
    response = SummaryResponse(
        sku=summary.sku,
        client_name=summary.client.name,
        state=summary.client.state,
        items_count=len(summary.products),
        total_price=summary.total_price,
    )

    assert response.total_price == 107.0
    assert response.client_name == "Empresa X"