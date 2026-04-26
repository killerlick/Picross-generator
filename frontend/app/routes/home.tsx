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
  const [picrossImg, setPicrossImg] = useState<any>(null);
  const [JSONDownloadUrl, setJSONDownloadUrl] = useState<any>(null);

  const { apiUrl } = useLoaderData<typeof loader>();

  const handleGenerate = async (e: any) => {
    setIsLoading(true);
    e.preventDefault();
    if (!file) { return }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("width", width);
    formData.append("height", height);

    try {
      const res = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        body: formData
      })

      const blob = await res.blob();
      const zip = await JSZip.loadAsync(blob);

      const imgFile = await zip.file("picross.png");
      const imgBlob = await imgFile!.async("blob");
      const imgUrl = URL.createObjectURL(imgBlob);
      setPicrossImg(imgUrl);

      const jsonFile = await zip.file("picross.json");
      const jsonContent = await jsonFile!.async("string");
      const jsonBlob = new Blob([jsonContent], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      setJSONDownloadUrl(jsonUrl);

    } catch (error) {
      console.error("Error generating picross puzzle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-16">
      <h1 className="text-5xl font-bold mb-4">Welcome to Picross Generator</h1>
      <p className="text-lg">Generate your own picross puzzles with ease!</p>
      <form className="flex flex-col gap-2 bg-gray-400 p-3 shadow-2xl" onSubmit={handleGenerate}>
        <input type="file" name="file"
          onChange={
            (e) => {
              if (!e.target.files) { return }
              setFile(e.target.files[0])
            }
          }
          required
        />

        <input className="bg-white" type="number" name="width" id="width" placeholder="Width" value={width} onChange={(e) => setWidth(e.target.value)} />
        <input className="bg-white" type="number" name="height" id="height" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} />
        <button className="bg-blue-500 p-2 rounded-2xl disabled:bg-gray-400" type="submit" disabled={isLoading} >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </form>

      {picrossImg && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <img
            src={picrossImg}
            alt="Picross puzzle"
          />

          <a href={JSONDownloadUrl}
            download="picross_puzzle.json"
            className="text-blue-500 underline"
          >
            Télécharger le json du puzzle
          </a>
        </div>
      )}


    </div>
  );
}

