import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const file = path.join(process.cwd(), "data", "bar_menu.json");
  if (!fs.existsSync(file)) return NextResponse.json([]);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  return NextResponse.json(items);
}