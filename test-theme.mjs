fetch("http://localhost:8081/api/theme", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ activeTheme: "new-esports" })
}).then(res => res.json()).then(console.log);
