import { useState } from "react";
import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import JSZip from "jszip";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "picross generator" },
    { name: "picross generator", content: "Generate picross puzzles" },
  ];
}

export async function loader() {
  return {
    apiUrl: process.env.API_URL || "http://localhost:8000"
  }
}

export default function Home() {

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState<string>("10");
  const [height, setHeight] = useState<string>("10");
  const [picrossImg, setPicrossImg] = useState<string | null>(null);
  const [JSONDownloadUrl, setJSONDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { apiUrl } = useLoaderData<typeof loader>();

  const picrossLogo = ["#534AB7", "#1D9E75", "#D85A30", "#534AB7", "#1D9E75",
    "#1D9E75", "#534AB7", "#1D9E75", "#D85A30", "#534AB7",
    "#D85A30", "#1D9E75", "#534AB7", "#1D9E75", "#D85A30",];

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    if (!file) { return }

    if (!width || !height) {
      setError("Please enter valid width and height values.");
      return;
    } else if (Number.parseInt(width) <= 0 || Number.parseInt(height) <= 0) {
      setError("Width and height must be positive integers.");
      return;
    }

    if (picrossImg) {
      URL.revokeObjectURL(picrossImg);
    }
    if (JSONDownloadUrl) {
      URL.revokeObjectURL(JSONDownloadUrl);
    }


    setIsLoading(true);
    setError(null);



    const formData = new FormData();
    formData.append("file", file);
    formData.append("width", width);
    formData.append("height", height);

    try {
      const res = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const blob = await res.blob();
      const zip = await JSZip.loadAsync(blob);

      const imgFile = zip.file("picross.png");
      const jsonFile = zip.file("picross.json");
      if (!imgFile || !jsonFile) {
        throw new Error("Missing files in the zip");
      }
      const imgBlob = await imgFile.async("blob");
      const imgUrl = URL.createObjectURL(imgBlob);
      setPicrossImg(imgUrl);

      const jsonContent = await jsonFile.async("string");
      const jsonBlob = new Blob([jsonContent], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      setJSONDownloadUrl(jsonUrl);

    } catch (error) {
      setError("Failed to generate picross puzzle. Please try again.");
      console.error("Error generating picross puzzle:", error);
      setPicrossImg(null);
      setJSONDownloadUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-16 px-4">
      {/** Logo et titre */}
      <div className="flex flex-col items-center mb-8">
        <div className="grid grid-cols-5 gap-1 mb-4">
          {
            picrossLogo.map((color, index) => (
              <div key={index}
                className="w-5 h-5 rounded-sm" style={{ backgroundColor: color }} ></div>
            ))
          }
        </div>
        <h1 className="text-5xl font-bold mb-4">Picross generator</h1>
        <p className="text-lg">Transformez n'importe quelle image en puzzle à résoudre</p>

      </div>

      <div className="flex gap-8 w-full max-w-4xl">
        <div className="flex-1">
          <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col gap-5 shadow-sm">

            <form className="flex flex-col gap-5"
              onSubmit={handleGenerate}>
              <div className="flex flex-col gap-1" >
                <label className=" text-xs text-gray-500">Votre image</label>
                <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg p-8">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-sm font-medium text-purple-800">
                    {file ? file.name : "Cliquez pour sélectionner une image"}
                  </span>
                  <span className="text-xs text-purple-600">
                    {file ? "Cliquer pour changer" : "ou cliquer pour choisir  - PNG, JPEG, WEBP"}
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    className="hidden"
                    onChange={
                      (e) => {
                        const target = e.target.files?.[0];
                        if (!target) { return }
                        if (!target.type.startsWith("image/")) {
                          setError("Please upload a valid image file.");
                          return;
                        }
                        setError(null);
                        setFile(target)
                      }
                    }
                    required
                  />
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Dimension</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    type="number"
                    placeholder="Largeur"
                    min={1}
                    max={1000}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)} />
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    type="number"
                    placeholder="Longueur"
                    min={1}
                    max={1000}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>

              <button
                className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50 hover:scale-101 bg-[#534AB7] hover:bg-purple-500 transition-all"
                type="submit"
                disabled={isLoading}


              >
                {isLoading ? "Generation en cours..." : "Generer mon picross !"}
              </button>
            </form>
          </div>
          {error && (
            <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>
          )}
        </div>

        <div className="flex-1">
          {/*Resultat de la generation*/}
          {picrossImg && (
            <div className="w-full max-w-md border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <img
                src={picrossImg}
                alt="Picross puzzle"
                className="w-full"
              />
              <div className="flex justify-between items-center px-5 py-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">picross_puzzle.json</span>
                <a href={JSONDownloadUrl ?? undefined}
                  download="picross_puzzle.json"
                  className="text-blue-500 underline"
                >
                  Télécharger le json du picross
                </a>
              </div>
            </div>
          )}
          {
            !picrossImg && (
              <div className="w-full max-w-md mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 py-12 bg-purple-50">
                  <div className="grid grid-cols-5 gap-1 opacity-40">
                    {[...Array(10)].map((_, i) => (
                      i % 2 === 0
                        ? <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: "#534AB7" }} />
                        : <div key={i} className="w-5 h-5 rounded-sm border-2 border-purple-300" />
                    ))}
                  </div>
                  <span className="text-sm text-purple-700">Votre puzzle apparaîtra ici</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3 border-t border-gray-200">
                  <span className="text-xs text-gray-400">picross_puzzle.json</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-300">Télécharger</span>
                </div>
              </div>
            )
          }

        </div>
      </div>


    </div>
  );
}

