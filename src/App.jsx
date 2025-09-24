import React, { useEffect, useState, useRef } from "react";

// App.jsx – Brújula Digital
export default function App() {
  const [heading, setHeading] = useState(0);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const needleRef = useRef(null);

  function degreesToCardinal(d) {
    const directions = [
      "N","NNE","NE","ENE","E","ESE","SE","SSE",
      "S","SSW","SW","WSW","W","WNW","NW","NNW",
    ];
    const index = Math.round(((d % 360) / 22.5)) % 16;
    return directions[index];
  }

  function normalizeAngle(a) {
    let res = a % 360;
    if (res < 0) res += 360;
    return res;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasDeviceOrientation =
      "DeviceOrientationEvent" in window ||
      "ondeviceorientationabsolute" in window;

    if (!hasDeviceOrientation) {
      setSupported(false);
      setError("Tu navegador no soporta DeviceOrientation API.");
      return;
    }

    const maybeNeedPermission =
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function";

    if (maybeNeedPermission) setPermissionNeeded(true);

    function handleOrientation(event) {
      let alpha = null;
      if (event.webkitCompassHeading != null) {
        alpha = event.webkitCompassHeading;
      } else if (event.alpha != null) {
        alpha = event.alpha;
        try {
          const orientationAngle =
            (screen.orientation && screen.orientation.angle) ||
            window.orientation ||
            0;
          alpha = alpha - orientationAngle;
        } catch {}
      }
      if (alpha != null && !Number.isNaN(alpha)) setHeading(normalizeAngle(alpha));
    }

    if (!maybeNeedPermission) {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
    };
  }, []);

  async function pedirPermiso() {
    setError(null);
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === "granted") {
        setPermissionNeeded(false);
        window.addEventListener("deviceorientation", (e) => {
          let alpha = null;
          if (e.webkitCompassHeading != null) {
            alpha = e.webkitCompassHeading;
          } else if (e.alpha != null) {
            alpha = e.alpha;
            try {
              const orientationAngle =
                (screen.orientation && screen.orientation.angle) ||
                window.orientation ||
                0;
              alpha = alpha - orientationAngle;
            } catch {}
          }
          if (alpha != null && !Number.isNaN(alpha)) setHeading(normalizeAngle(alpha));
        });
      } else {
        setError("Permiso denegado para acceder a sensores.");
      }
    } catch (err) {
      setError("Error pidiendo permiso: " + (err?.message || err));
    }
  }

  const needleStyle = {
    transform: `rotate(${-heading}deg)`,
    transition: "transform 300ms ease-out",
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-2">Brújula digital</h2>
      <p className="text-sm text-gray-600 mb-4">
        Usa los sensores del dispositivo para indicar el norte.
      </p>

      {!supported && (
        <div className="text-red-600">
          Tu navegador no soporta la API de orientación.
        </div>
      )}

      {permissionNeeded && (
        <div className="mb-4">
          <p className="text-sm text-yellow-700 mb-2">
            Este dispositivo requiere permiso para usar los sensores.
          </p>
          <button
            onClick={pedirPermiso}
            className="px-4 py-2 rounded-full bg-blue-600 text-white hover:opacity-90"
          >
            Pedir permiso
          </button>
        </div>
      )}

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="flex flex-col items-center">
        <div className="relative w-56 h-56 rounded-full border-4 border-gray-200 flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="100" cy="100" r="96" fill="transparent" />
            <text x="100" y="22" textAnchor="middle" fontSize="12" fontWeight="700">
              N
            </text>
            <text x="178" y="105" textAnchor="middle" fontSize="12" fontWeight="700">
              E
            </text>
            <text x="100" y="190" textAnchor="middle" fontSize="12" fontWeight="700">
              S
            </text>
            <text x="22" y="105" textAnchor="middle" fontSize="12" fontWeight="700">
              W
            </text>
            <circle cx="100" cy="100" r="60" fill="rgba(0,0,0,0.03)" />
          </svg>

          <div
            ref={needleRef}
            style={needleStyle}
            className="absolute w-40 h-40 flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-2/3 h-2/3 flex items-center justify-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-28 border-transparent border-b-red-500" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-12 rounded bg-gray-700" />
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-400" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-4xl font-mono">{Math.round(heading)}°</div>
          <div className="text-lg text-gray-600">
            {degreesToCardinal(heading)}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Si la aguja no responde, usa un dispositivo móvil y otorga permiso.
        </div>
      </div>
    </div>
  );
}
