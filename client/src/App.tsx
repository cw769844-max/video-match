import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import "./App.css";

interface Me {
  id: string;
  username: string;
}

function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    apiFetch<Me>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="app-shell">
      <h1>Yu-Gi-Oh Progression</h1>
      <p>
        {me === undefined && "Checking session..."}
        {me === null && "Not signed in."}
        {me && `Signed in as ${me.username}`}
      </p>
    </div>
  );
}

export default App;
