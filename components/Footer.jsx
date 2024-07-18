import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="flex sticky bottom-0 justify-center items-center py-4 bg-zinc-950 text-white">
      <p>
        Made with <Heart  className="inline-block  text-red-500 h-5 w-5 mx-1" fill="red" color="red"/>{" "}
        by GDSC MPSTME
      </p>
    </footer>
  );
}
