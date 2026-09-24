import { useEffect, useState } from "react";
import { getModels } from "../api/llm";

/**
 * Fetches the model catalog once on mount.
 *
 * `status` is one of "loading" | "ready" | "error" so the UI can render a
 * clear state instead of guessing from an empty array.
 */
export function useModels() {
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getModels()
      .then((fetched) => {
        if (cancelled) return;
        setModels(fetched);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Could not reach the backend.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, status, error };
}
