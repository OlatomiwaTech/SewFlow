# SewFlow

A full-stack garment production and order management application.

## Project structure

```text
sewflow/
├── frontend/
│   ├── app/              # Next.js app
│   ├── components/
│   ├── features/
│   │   ├── customers/
│   │   ├── measurements/
│   │   ├── orders/
│   │   ├── garments/
│   │   └── dashboard/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── package.json
└── README.md
```

## Getting started

- Install dependencies for the monorepo: `npm install`
- Run the frontend: `npm run dev`
- Run the backend: `npm run backend`
