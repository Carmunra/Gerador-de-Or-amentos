from app.main import app

def test_fastapi_import():
    # Se conseguir importar sem erro, o ambiente está ok!
    assert app is not None