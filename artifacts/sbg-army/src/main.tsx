import { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function Root() {
  const [ready, setReady] = useState(false);

  return (
    <ErrorBoundary>
      {!ready && <LoadingScreen onDone={() => setReady(true)} />}
      <div style={{ visibility: ready ? 'visible' : 'hidden', opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <App />
      </div>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
