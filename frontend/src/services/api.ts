const API_URL = "http://127.0.0.1:5001"; // Flask backend

export async function getSchema() {
  const res = await fetch(`${API_URL}/schema`);
  return await res.json();
}

export async function predictAndMatch(data: any) {
  const res = await fetch(`${API_URL}/predict_and_match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function getRoute(start: number[], end: number[]) {
  const res = await fetch(`${API_URL}/get_route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });
  return await res.json();
}
