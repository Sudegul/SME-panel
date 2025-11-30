# SMA Panel Backend

FastAPI backend for SMA Panel - Sales Management Application

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run the application:
```bash
uvicorn app.main:app --reload
```

## Project Structure

```
backend/
├── app/
│   ├── models/          # Database models
│   ├── routers/         # API routes
│   ├── schemas/         # Pydantic schemas
│   ├── utils/           # Utility functions
│   ├── config.py        # Configuration
│   ├── database.py      # Database connection
│   └── main.py          # Application entry point
├── .env                 # Environment variables
├── .gitignore
├── requirements.txt
└── README.md
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
