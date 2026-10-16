import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminPage from "@/pages/AdminPage";

const withText = (text: string) => (_: string, el: Element | null) => el?.textContent === text;

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

    const searchInput = await screen.findByLabelText(/buscar item/i);
    fireEvent.change(searchInput, { target: { value: "NutellaInexistente12345" } });

    expect(await screen.findByText(/nenhum item encontrado/i)).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Banana" } });
    expect((await screen.findAllByText(/banana/i)).length).toBeGreaterThan(0);
  });

  it("limpa a busca pelo botão de limpar", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const searchInput = await screen.findByLabelText(/buscar item/i);
    fireEvent.change(searchInput, { target: { value: "Banana" } });
    fireEvent.click(screen.getByRole("button", { name: /limpar busca/i }));
    expect(searchInput).toHaveValue("");
  });

  it("a visão geral mostra os números do dia e leva à aba certa", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    fireEvent.click((await screen.findAllByText(/visão geral/i))[0]);
    fireEvent.click(await screen.findByRole("button", { name: /pedidos em aberto/i }));
    expect(await screen.findByText(/faturamento hoje/i)).toBeInTheDocument();
  });

  it("opens 'Novo Item' modal and adds an item", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const novoItemBtn = await screen.findByText(/novo item/i);
    fireEvent.click(novoItemBtn);

    expect(await screen.findByRole("dialog", { name: /adicionar novo item/i })).toBeInTheDocument();
    expect(screen.getByText(/dica de performance:/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/nome do item/i);
    fireEvent.change(nameInput, { target: { value: "Super Açaí Teste Unitário" } });
    expect(screen.getByLabelText(/^preço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^categoria$/i)).toBeInTheDocument();

    const availability = screen.getByRole("switch", { name: /disponível no cardápio/i });
    expect(availability).toHaveAttribute("aria-checked", "true");
    fireEvent.click(availability);
    expect(availability).toHaveAttribute("aria-checked", "false");
    fireEvent.click(availability);

    const saveBtn = screen.getByRole("button", { name: /salvar item/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Super Açaí Teste Unitário")).toBeInTheDocument();
    });
  });

  it("aceita preço com centavos quebrados ao editar (R$ 29,99)", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /^editar pote de 1l/i }));
    const price = await screen.findByLabelText(/^preço/i);
    expect(price).toHaveValue(29.99);
    expect((price as HTMLInputElement).checkValidity()).toBe(true);
  });

  it("fecha o formulário de item e a confirmação de exclusão com Esc", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    fireEvent.click(await screen.findByText(/novo item/i));
    expect(await screen.findByRole("dialog", { name: /adicionar novo item/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /^excluir /i })[0]);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens delete confirmation modal and removes item", async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    const searchInput = await screen.findByLabelText(/buscar item/i);
    fireEvent.change(searchInput, { target: { value: "Abacaxi ao vinho" } });

    const deleteButtons = await screen.findAllByRole("button", { name: /^excluir abacaxi ao vinho/i });
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByRole("alertdialog", { name: /excluir item\?/i })).toBeInTheDocument();
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
        const body = String(input).includes("/api/admin/orders") ? apiOrders : [];
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
      expect(screen.getByText(withText("Pagamento: Cartão"))).toBeInTheDocument();
      expect(screen.getByText(withText("Pagamento: Dinheiro"))).toBeInTheDocument();
      expect(screen.queryByText(withText("Pagamento: card"))).not.toBeInTheDocument();
      expect(screen.queryByText(/💳|🛵|🛍️/)).not.toBeInTheDocument();
    });

    it("mostra pagamento no balcão para retirada sem forma de pagamento", async () => {
      vi.mocked(globalThis.fetch).mockImplementation((input) => {
        const body = String(input).includes("/api/admin/orders")
          ? [{ ...apiOrders[1], paymentMethod: null }]
          : [];
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      });
      await openOrdersTab();

      expect(screen.getByText(withText("Pagamento: No balcão"))).toBeInTheDocument();
      expect(screen.queryByText(withText("Pagamento: Pix"))).not.toBeInTheDocument();
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

  describe("períodos reais em pedidos e relatórios", () => {
    const now = Date.now();
    const periodOrders = [
      {
        _id: "6710cc000000000000000001", total: 25, deliveryMethod: "pickup", paymentMethod: "pix",
        items: ["Pedido de hoje"], createdAt: new Date(now).toISOString(),
      },
      {
        _id: "6710cc000000000000000002", total: 40, deliveryMethod: "pickup", paymentMethod: "card",
        items: ["Pedido de 3 dias atrás"], createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
      localStorage.setItem("adminToken", "real-jwt-token");
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        const body = String(input).includes("/api/admin/orders") ? periodOrders : [];
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function renderAdmin() {
      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
    }

    it("busca no servidor só os pedidos do período dos relatórios", async () => {
      renderAdmin();
      await waitFor(() => expect(fetchSpy.mock.calls.some(([url]) => String(url).includes("/api/admin/orders?from="))).toBe(true));
    });

    it("'Pedidos do Dia' mostra só os pedidos de hoje", async () => {
      renderAdmin();
      fireEvent.click((await screen.findAllByText(/pedidos do dia/i))[0]);
      await screen.findByText(/faturamento hoje/i);

      expect(screen.getByText("Pedido de hoje")).toBeInTheDocument();
      expect(screen.queryByText("Pedido de 3 dias atrás")).not.toBeInTheDocument();
    });

    it("os filtros Hoje / 7 Dias mudam os números do relatório", async () => {
      renderAdmin();
      fireEvent.click((await screen.findAllByText(/relatórios/i))[0]);
      await screen.findByText(/faturamento bruto/i);

      expect(screen.getByText("Baseado em 1 pedido")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: /faturamento bruto/i })).getByText("R$ 25,00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /7 dias/i }));
      expect(screen.getByText("Baseado em 2 pedidos")).toBeInTheDocument();
      expect(within(screen.getByRole("group", { name: /faturamento bruto/i })).getByText("R$ 65,00")).toBeInTheDocument();
    });
  });

  describe("status dos pedidos", () => {
    const statusOrders = [
      {
        _id: "6710dd000000000000000001", total: 30, deliveryMethod: "delivery", paymentMethod: "pix",
        items: ["Pedido em aberto"], createdAt: new Date().toISOString(),
        address: { street: "Rua A", number: "1", neighborhood: "Centro" },
      },
    ];
    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
      localStorage.setItem("adminToken", "real-jwt-token");
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
        if (init?.method === "PATCH") {
          const body = JSON.parse(String(init.body));
          return Promise.resolve(new Response(JSON.stringify({ success: true, status: body.status }), { status: 200 }));
        }
        const body = String(input).includes("/api/admin/orders") ? statusOrders : [];
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function openOrders() {
      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );
      fireEvent.click((await screen.findAllByText(/pedidos do dia/i))[0]);
      await screen.findByText("Pedido em aberto");
    }

    const patchCalls = () => fetchSpy.mock.calls.filter(([, init]) => init?.method === "PATCH");

    it("mostra o status e avança o pedido etapa por etapa", async () => {
      await openOrders();
      expect(screen.getByText("Novo")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /marcar como em preparo/i }));
      expect(await screen.findByText("Em preparo")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /marcar como saiu para entrega/i }));
      expect(await screen.findByText("Saiu para entrega")).toBeInTheDocument();

      const [url, init] = patchCalls()[0];
      expect(String(url)).toContain("/api/admin/orders/6710dd000000000000000001/status");
      expect(JSON.parse(String(init?.body))).toEqual({ status: "preparing" });
      expect(JSON.parse(String(patchCalls()[1][1]?.body))).toEqual({ status: "ready" });
    });

    it("cancela só depois de confirmar", async () => {
      await openOrders();

      fireEvent.click(screen.getByRole("button", { name: /cancelar pedido/i }));
      expect(patchCalls()).toHaveLength(0);

      fireEvent.click(screen.getByRole("button", { name: /confirmar cancelamento/i }));
      expect(await screen.findByText("Cancelado")).toBeInTheDocument();
      expect(JSON.parse(String(patchCalls()[0][1]?.body))).toEqual({ status: "cancelled" });
    });
  });

  describe("quando o servidor recusa uma alteração", () => {
    const serverItem = {
      _id: "6710bb000000000000000001", id: "fr_kiwi", name: "Kiwi", price: 1.5,
      category: "Fruta", original_category: "fruits", active: true,
    };
    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
      localStorage.setItem("adminToken", "real-jwt-token");
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
        const url = String(input);
        if (init?.method === "PUT") {
          return Promise.resolve(new Response(JSON.stringify({ error: "Campo active deve ser verdadeiro ou falso" }), { status: 422 }));
        }
        const body = url.endsWith("/api/admin/menu") ? [serverItem] : [];
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("mostra o erro do servidor e recarrega o estado real em vez de confirmar", async () => {
      render(
        <BrowserRouter>
          <AdminPage />
        </BrowserRouter>
      );

      fireEvent.click(await screen.findByRole("button", { name: /^ativo$/i }));

      expect(await screen.findByText("Campo active deve ser verdadeiro ou falso")).toBeInTheDocument();
      expect(screen.queryByText(/item atualizado com sucesso/i)).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("button", { name: /^ativo$/i })).toBeInTheDocument());

      const menuLoads = fetchSpy.mock.calls.filter(([url, init]) => String(url).endsWith("/api/admin/menu") && !init?.method);
      expect(menuLoads.length).toBeGreaterThanOrEqual(2);
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
