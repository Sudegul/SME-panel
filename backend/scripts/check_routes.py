from app.main import app

print('Registered Routes:')
for route in app.routes:
    if hasattr(route, 'methods'):
        print(f'{route.methods} {route.path}')
    else:
        print(f'{route.path}')
