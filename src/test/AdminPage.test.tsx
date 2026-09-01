import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminPage from "@/pages/AdminPage";

describe("AdminPage - Painel Administrativo", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("adminToken", "demo-token-123");
    vi.clearAllMocks();
  });

  it("renders the admin panel with tabs and stats", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/admin painel/i)).toBeInTheDocument();
    expect(screen.getByText(/gestão do cardápio/i)).toBeInTheDocument();
    expect(screen.getByText(/pedidos do dia/i)).toBeInTheDocument();
    expect(await screen.findByText(/novo item/i)).toBeInTheDocument();
  });

  it("renders category filters and allows switching categories", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const saboreButton = await screen.findByText(/sabores de açaí/i);
    expect(saboreButton).toBeInTheDocument();

    fireEvent.click(saboreButton);
    expect(await screen.findByText(/açaí natural/i)).toBeInTheDocument();
  });

  it("filters items in real time via search input", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/buscar por nome ou categoria/i);
    fireEvent.change(searchInput, { target: { value: "NutellaInexistente12345" } });

    expect(await screen.findByText(/nenhum item encontrado/i)).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Banana" } });
    expect((await screen.findAllByText(/banana/i)).length).toBeGreaterThan(0);
  });

  it("opens 'Novo Item' modal and adds an item", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const novoItemBtn = await screen.findByText(/novo item/i);
    fireEvent.click(novoItemBtn);

    expect(await screen.findByText(/adicionar novo item/i)).toBeInTheDocument();
    expect(screen.getByText(/dica de performance:/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/ex: açaí c\/ morango especial/i);
    fireEvent.change(nameInput, { target: { value: "Super Açaí Teste Unitário" } });

    const saveBtn = screen.getByRole("button", { name: /salvar item/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Super Açaí Teste Unitário")).toBeInTheDocument();
    });
  });

  it("opens delete confirmation modal and removes item", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/buscar por nome ou categoria/i);
    fireEvent.change(searchInput, { target: { value: "Abacaxi ao vinho" } });

    const deleteButtons = await screen.findAllByTitle(/excluir/i);
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/excluir item\?/i)).toBeInTheDocument();
    expect(screen.getByText(/tem certeza que deseja excluir/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /excluir definitivamente/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText("Abacaxi ao vinho 50ml")).not.toBeInTheDocument();
    });
  });
});
