import app from "./src/server.js";

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
