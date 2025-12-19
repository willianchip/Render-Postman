import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "API online" });
});

app.post("/sessions", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name é obrigatório" });
  }

  return res.json({
    status: "created",
    session: name
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
