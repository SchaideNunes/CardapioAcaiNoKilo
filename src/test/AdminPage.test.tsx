import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  it("switches to 'Pedidos do Dia' tab and displays orders list", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const ordersBtn = (await screen.findAllByText(/pedidos do dia/i))[0];
    fireEvent.click(ordersBtn);

    expect(await screen.findByText(/faturamento hoje/i)).toBeInTheDocument();
    expect(screen.getByText(/total de pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/retirada no balcão/i)).toBeInTheDocument();
  });

  describe("pedidos gravados pelo site (códigos delivery/pickup, pix/card/cash)", () => {
    const apiOrders = [
      {
        _id: "6710aa000000000000000001",
        origin: "ready_made",
        total: 47,
        deliveryMethod: "delivery",
        paymentMethod: "card",
        items: ["2x Açaí Natural 500ml"],
        address: { street: "Rua das Flores", number: "42", neighborhood: "Centro" },
        createdAt: new Date().toISOString(),
      },
      {
        _id: "6710aa000000000000000002",
        origin: "custom",
        total: 22,
        deliveryMethod: "pickup",
        paymentMethod: "cash",
        items: ["Pote de 750", "Granola tradicional 50ml"],
        createdAt: new Date().toISOString(),
      },
    ];

    beforeEach(() => {
      localStorage.setItem("adminToken", "real-jwt-token");
      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        const body = String(input).endsWith("/api/admin/orders") ? apiOrders : [];
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function openOrdersTab() {
      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
      fireEvent.click((await screen.findAllByText(/pedidos do dia/i))[0]);
      await screen.findByText(/faturamento hoje/i);
    }

    it("exibe rótulos em português e o endereço do pedido de entrega", async () => {
      await openOrdersTab();

      expect(screen.getByText("Rua das Flores, 42 - Centro")).toBeInTheDocument();
      expect(screen.getByText(/💳 Cartão/)).toBeInTheDocument();
      expect(screen.getByText(/💳 Dinheiro/)).toBeInTheDocument();
      expect(screen.queryByText(/💳 card/)).not.toBeInTheDocument();
    });

    it("filtra por entrega e por forma de pagamento", async () => {
      await openOrdersTab();

      fireEvent.click(screen.getByRole("button", { name: /entrega \(1\)/i }));
      expect(screen.getByText("2x Açaí Natural 500ml")).toBeInTheDocument();
      expect(screen.queryByText("Pote de 750")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Dinheiro" }));
      expect(screen.getByText("Pote de 750")).toBeInTheDocument();
      expect(screen.queryByText("2x Açaí Natural 500ml")).not.toBeInTheDocument();
    });
  });

  it("switches to 'Relatórios' tab and displays analytics metrics", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const reportsBtn = (await screen.findAllByText(/relatórios/i))[0];
    fireEvent.click(reportsBtn);

    expect(await screen.findByText(/relatórios & desempenho/i)).toBeInTheDocument();
    expect(screen.getByText(/faturamento bruto/i)).toBeInTheDocument();
    expect(screen.getByText(/ticket médio/i)).toBeInTheDocument();
    expect(screen.getByText(/divisão por forma de pagamento/i)).toBeInTheDocument();
  });
});
