import { NextResponse } from "next/server";

/**
 * Wrapper around NextResponse.json que garante explicitamente o header
 * Content-Type: application/json; charset=utf-8 em todas as respostas,
 * assegurando que acentos do portugues sejam exibidos corretamente no cliente.
 */
export function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  return response;
}
