"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  Layers,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Tag,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { CATEGORIES, COMPLETED_ORDER_STATUS, DELIVERY_LABELS, ORDER_STATUSES, PAYMENT_LABELS } from "@/lib/constants";
import { WhatsApp } from "@/components/Icons";
import { useCookieConsent } from "@/lib/use-cookie-consent";
import { compressImage } from "@/lib/compressImage";
import { formatMoney } from "@/lib/currency";
import { DEFAULT_SITE_CONFIG } from "@/lib/demo-data";
import type { Category, OrderStatus, Product, PublicOrder, SiteConfig } from "@/types/store";

type ProductFormState = {
  id?: string;
  nome: string;
  categoria: Category;
  fotosText: string;
  descricao: string;
  preco_normal: string;
  preco_desconto: string;
  preco_pix: string;
  estoque_qtd: string;
  ativo: boolean;
};

const emptyProductForm: ProductFormState = {
  nome: "",
  categoria: CATEGORIES[0],
  fotosText: "",
  descricao: "",
  preco_normal: "",
  preco_desconto: "",
  preco_pix: "",
  estoque_qtd: "0",
  ativo: true
};

function productToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    nome: product.nome,
    categoria: product.categoria,
    fotosText: product.fotos.join("\n"),
    descricao: product.descricao ?? "",
    preco_normal: String(product.preco_normal),
    preco_desconto: product.preco_desconto == null ? "" : String(product.preco_desconto),
    preco_pix: product.preco_pix == null ? "" : String(product.preco_pix),
    estoque_qtd: String(product.estoque_qtd),
    ativo: product.ativo
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatWhatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const fullDigits = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://api.whatsapp.com/send?phone=${fullDigits}`;
}

function formatOrderDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [message, setMessage] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Navegação ergonômica por abas (focada em mobile e desktop)
  const [activeTab, setActiveTab] = useState<"products" | "editor" | "orders" | "banners" | "all">("products");

  // Ferramentas de filtro e ordenação de produtos
  const [productSearch, setProductSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<"default" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc">("default");

  // Filtro de pedidos
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const inStockCount = useMemo(() => products.filter((p) => p.estoque_qtd > 0).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.estoque_qtd <= 0).length, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (productSearch.trim()) {
          const q = productSearch.toLowerCase();
          const matchName = p.nome.toLowerCase().includes(q);
          const matchCat = p.categoria.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchId) return false;
        }
        if (stockFilter === "in_stock" && p.estoque_qtd <= 0) return false;
        if (stockFilter === "out_of_stock" && p.estoque_qtd > 0) return false;
        if (categoryFilter !== "all" && p.categoria !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const priceA = a.preco_desconto ?? a.preco_normal;
        const priceB = b.preco_desconto ?? b.preco_normal;
        if (priceSort === "price_asc") return priceA - priceB;
        if (priceSort === "price_desc") return priceB - priceA;
        if (priceSort === "stock_asc") return a.estoque_qtd - b.estoque_qtd;
        if (priceSort === "stock_desc") return b.estoque_qtd - a.estoque_qtd;
        if (priceSort === "name_asc") return a.nome.localeCompare(b.nome);
        return 0;
      });
  }, [products, productSearch, stockFilter, categoryFilter, priceSort]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter !== "all" && order.status !== orderStatusFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchName = order.cliente_nome.toLowerCase().includes(q);
        const matchPhone = order.cliente_whatsapp.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  function startEditingProduct(product: Product) {
    setProductForm(productToForm(product));
    setActiveTab("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNewProduct() {
    setProductForm(emptyProductForm);
    setActiveTab("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removePhotoByIndex(index: number) {
    const lines = productForm.fotosText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const next = lines.filter((_, i) => i !== index);
    setProductForm((c) => ({ ...c, fotosText: next.join("\n") }));
  }

  async function loadAdminData() {
    const [productsResponse, ordersResponse, configResponse] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/site-config", { cache: "no-store" })
    ]);

    if (productsResponse.ok) {
      const data = (await productsResponse.json()) as { products?: Product[] };
      setProducts(data.products ?? []);
    }

    if (ordersResponse.ok) {
      const data = (await ordersResponse.json()) as { orders?: PublicOrder[] };
      setOrders(data.orders ?? []);
    }

    if (configResponse.ok) {
      const data = (await configResponse.json()) as { config?: SiteConfig };
      if (data.config) setSiteConfig(data.config);
    }
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (response.ok) {
          setLoggedIn(true);
          await loadAdminData();
        }
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });

    if (!response.ok) {
      setMessage("Credenciais inválidas ou Supabase Auth não configurado.");
      return;
    }

    setLoggedIn(true);
    setLoginPassword("");
    await loadAdminData();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setProducts([]);
    setOrders([]);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setMessage("");

    const payload = {
      id: productForm.id,
      nome: productForm.nome,
      categoria: productForm.categoria,
      fotos: productForm.fotosText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      descricao: productForm.descricao.trim() ? productForm.descricao.trim() : undefined,
      preco_normal: Number(productForm.preco_normal),
      preco_desconto: productForm.preco_desconto ? Number(productForm.preco_desconto) : null,
      preco_pix: productForm.preco_pix ? Number(productForm.preco_pix) : null,
      estoque_qtd: Number(productForm.estoque_qtd),
      ativo: productForm.ativo
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        const apiError = data?.error?.trim();
        const statusLabel = response.status ? `${response.status}${response.statusText ? ` ${response.statusText}` : ""}` : "";
        throw new Error(apiError || (statusLabel ? `Falha ao salvar (${statusLabel})` : "Não foi possível salvar o produto."));
      }

      setProductForm(emptyProductForm);
      setMessage("Produto salvo com sucesso.");
      await loadAdminData();
      setActiveTab("products");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");

    try {
      // Log original size
      console.log('Original file size (KB):', file.size / 1024);
      // Compress the image before upload
      const compressed = await compressImage(file);
      console.log('Compressed file size (KB):', compressed.size / 1024);
      const base64 = await fileToDataUrl(compressed);
      const response = await fetch("/api/admin/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: compressed.name,
          contentType: compressed.type,
          size: compressed.size,
          base64
        })
      });
      const data = (await response.json()) as { url?: string };
      if (!response.ok || !data.url) throw new Error("upload");
      setProductForm((current) => ({
        ...current,
        fotosText: [current.fotosText.trim(), data.url].filter(Boolean).join("\n")
      }));
      setMessage("Foto enviada.");
    } catch {
      setMessage("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("Remover este produto? Essa ação não pode ser desfeita.")) return;
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      const apiError = data?.error?.trim();
      const statusLabel = response.status ? `${response.status}${response.statusText ? ` ${response.statusText}` : ""}` : "";
      setMessage(apiError || (statusLabel ? `Falha ao remover (${statusLabel})` : "Não foi possível remover o produto."));
      return;
    }
    await loadAdminData();
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    const response = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    if (!response.ok) {
      setMessage("Não foi possível atualizar o pedido.");
      return;
    }

    const data = (await response.json()) as { order?: PublicOrder };
    if (data.order) {
      setOrders((current) => current.map((order) => (order.id === data.order?.id ? data.order : order)));
      setMessage("Status atualizado.");
    }
  }

  async function deleteOrder(id: string) {
    if (!window.confirm(`Excluir o pedido ${id}? Essa ação não pode ser desfeita.`)) return;
    const response = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(data?.error?.trim() || "Não foi possível excluir o pedido.");
      return;
    }
    setOrders((current) => current.filter((order) => order.id !== id));
    setMessage("Pedido excluído.");
  }

  async function uploadBanner(file: File | undefined) {
    if (!file) return;
    setBannerUploading(true);
    setMessage("");

    try {
      const base64 = await fileToDataUrl(file);
      const response = await fetch("/api/admin/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          base64,
          folder: "banners"
        })
      });
      const data = (await response.json()) as { url?: string };
      if (!response.ok || !data.url) throw new Error("upload");
      setSiteConfig((current) => ({
        banners: [...current.banners, { id: crypto.randomUUID(), imagem: data.url as string }]
      }));
      setMessage("Banner adicionado — clique em Salvar banners para publicar.");
    } catch {
      setMessage("Não foi possível enviar o banner.");
    } finally {
      setBannerUploading(false);
    }
  }

  function removeBanner(index: number) {
    setSiteConfig((current) => ({ banners: current.banners.filter((_, i) => i !== index) }));
  }

  function moveBanner(index: number, direction: -1 | 1) {
    setSiteConfig((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.banners.length) return current;
      const next = [...current.banners];
      [next[index], next[target]] = [next[target], next[index]];
      return { banners: next };
    });
  }

  async function saveBanners() {
    const response = await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteConfig)
    });

    if (!response.ok) {
      setMessage("Não foi possível salvar os banners.");
      return;
    }

    setMessage("Banners salvos.");
  }

  if (checkingSession) {
    return (
      <main className="adminShell">
        <div className="adminLoading">Carregando painel...</div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="adminShell loginShell">
        <a href="/" className="adminBackLink"><ArrowLeft size={16} /> Voltar para a loja</a>
        <form className="loginPanel" onSubmit={login}>
          <div className="adminTitle">
            <Package size={24} />
            <div>
              <h1>Painel Tuli Store</h1>
              <span>Acesso do ADM</span>
            </div>
          </div>
          <label>
            E-mail
            <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required minLength={8} />
          </label>
          {message ? <p className="errorText">{message}</p> : null}
          <button className="checkoutButton">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="adminShell">
      <a href="/" className="adminBackLink"><ArrowLeft size={16} /> Voltar para a loja</a>
      <header className="adminTopbar">
        <div className="adminTitle">
          <Package size={24} />
          <div>
            <h1>Painel Tuli Store</h1>
            <span>Produtos, pedidos e banners</span>
          </div>
        </div>
        <div className="adminActions">
          <button
            type="button"
            className="adminHeaderBtn refresh"
            onClick={loadAdminData}
            title="Recarregar dados"
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            className="adminHeaderBtn logout"
            onClick={logout}
            title="Sair do painel"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {message ? <p className="adminMessage">{message}</p> : null}

      {/* CARDS DE DESEMPENHO E MÉTRICAS RÁPIDAS (KPIS) */}
      <section className="adminKpis" aria-label="Métricas rápidas">
        <div
          className={`adminKpiCard${stockFilter === "all" && activeTab === "products" ? " active" : ""}`}
          onClick={() => { setActiveTab("products"); setStockFilter("all"); }}
          role="button"
          tabIndex={0}
        >
          <div className="adminKpiIcon kpiTotal"><Package size={20} /></div>
          <div className="adminKpiInfo">
            <span className="adminKpiValue">{products.length}</span>
            <span className="adminKpiLabel">Total Itens</span>
          </div>
        </div>

        <div
          className={`adminKpiCard${stockFilter === "in_stock" && activeTab === "products" ? " active" : ""}`}
          onClick={() => { setActiveTab("products"); setStockFilter("in_stock"); }}
          role="button"
          tabIndex={0}
        >
          <div className="adminKpiIcon kpiInStock"><CheckCircle2 size={20} /></div>
          <div className="adminKpiInfo">
            <span className="adminKpiValue">{inStockCount}</span>
            <span className="adminKpiLabel">Com Estoque</span>
          </div>
        </div>

        <div
          className={`adminKpiCard kpiAlert${stockFilter === "out_of_stock" && activeTab === "products" ? " active" : ""}`}
          onClick={() => { setActiveTab("products"); setStockFilter("out_of_stock"); }}
          role="button"
          tabIndex={0}
        >
          <div className="adminKpiIcon kpiOutStock"><AlertTriangle size={20} /></div>
          <div className="adminKpiInfo">
            <span className="adminKpiValue">{outOfStockCount}</span>
            <span className="adminKpiLabel">Sem Estoque</span>
          </div>
        </div>

        <div
          className={`adminKpiCard${activeTab === "orders" ? " active" : ""}`}
          onClick={() => setActiveTab("orders")}
          role="button"
          tabIndex={0}
        >
          <div className="adminKpiIcon kpiOrders"><ClipboardList size={20} /></div>
          <div className="adminKpiInfo">
            <span className="adminKpiValue">{orders.length}</span>
            <span className="adminKpiLabel">Pedidos</span>
          </div>
        </div>
      </section>

      {/* ABAS ERGONÔMICAS DE NAVEGAÇÃO (MOBILE & DESKTOP) */}
      <nav className="adminTabs" aria-label="Navegação do painel">
        <button
          type="button"
          className={`adminTabBtn${activeTab === "products" ? " active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={17} />
          <span>Produtos</span>
          <span className="adminTabBadge">{products.length}</span>
        </button>

        <button
          type="button"
          className={`adminTabBtn${activeTab === "editor" ? " active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          <Pencil size={17} />
          <span>{productForm.id ? "Editando" : "Novo Produto"}</span>
          {productForm.id ? <span className="adminTabDot" /> : null}
        </button>

        <button
          type="button"
          className={`adminTabBtn${activeTab === "orders" ? " active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <ClipboardList size={17} />
          <span>Pedidos</span>
          <span className="adminTabBadge">{orders.length}</span>
        </button>

        <button
          type="button"
          className={`adminTabBtn${activeTab === "banners" ? " active" : ""}`}
          onClick={() => setActiveTab("banners")}
        >
          <Settings size={17} />
          <span>Banners</span>
        </button>

        <button
          type="button"
          className={`adminTabBtn desktopOnly${activeTab === "all" ? " active" : ""}`}
          onClick={() => setActiveTab("all")}
          title="Ver todas as seções juntas"
        >
          <Layers size={17} />
          <span>Visão Geral</span>
        </button>
      </nav>

      {/* SEÇÃO PRODUTOS */}
      {(activeTab === "products" || activeTab === "all") && (
        <section className="adminSection productListSection">
          <div className="sectionHeading between">
            <div className="headingTitle">
              <Package size={20} />
              <h2>Produtos ({filteredProducts.length}{filteredProducts.length !== products.length ? ` de ${products.length}` : ""})</h2>
            </div>
            <button
              type="button"
              className="adminSecondaryAddBtn"
              onClick={startNewProduct}
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </button>
          </div>

          {/* FERRAMENTAS DE FILTRO E ERGONOMIA */}
          <div className="adminFilterPanel">
            {/* Linha 1: Busca e Botão Adicionar */}
            <div className="adminSearchRow">
              <div className="adminSearchInputWrap">
                <Search size={18} className="adminSearchIcon" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome, ref ou categoria..."
                  className="adminSearchInput"
                />
                {productSearch ? (
                  <button
                    type="button"
                    className="adminSearchClear"
                    onClick={() => setProductSearch("")}
                    aria-label="Limpar busca"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="adminPrimaryAddBtn"
                onClick={startNewProduct}
              >
                <Plus size={18} />
                <span>Novo Produto</span>
              </button>
            </div>

            {/* Linha 2: Filtros de Estoque e Ordenação de Preço */}
            <div className="adminFiltersRow">
              <div className="adminPillsGroup" role="group" aria-label="Filtro de estoque">
                <button
                  type="button"
                  className={`adminFilterPill${stockFilter === "all" ? " active" : ""}`}
                  onClick={() => setStockFilter("all")}
                >
                  Todos ({products.length})
                </button>
                <button
                  type="button"
                  className={`adminFilterPill inStock${stockFilter === "in_stock" ? " active" : ""}`}
                  onClick={() => setStockFilter("in_stock")}
                >
                  <span className="pillDot green" /> Com estoque ({inStockCount})
                </button>
                <button
                  type="button"
                  className={`adminFilterPill outStock${stockFilter === "out_of_stock" ? " active" : ""}`}
                  onClick={() => setStockFilter("out_of_stock")}
                >
                  <span className="pillDot red" /> Sem estoque ({outOfStockCount})
                </button>
              </div>

              <div className="adminSelectsGroup">
                {/* Ordenação por Preço / Estoque / Nome */}
                <label className="adminSelectLabel">
                  <ArrowUpDown size={15} />
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as typeof priceSort)}
                    aria-label="Ordenar produtos"
                  >
                    <option value="default">Ordenação padrão</option>
                    <option value="price_asc">Menor Preço (R$ ↑)</option>
                    <option value="price_desc">Maior Preço (R$ ↓)</option>
                    <option value="stock_desc">Maior Estoque (Qtd ↓)</option>
                    <option value="stock_asc">Menor Estoque (Qtd ↑)</option>
                    <option value="name_asc">Nome (A - Z)</option>
                  </select>
                </label>

                {/* Filtro de Categoria */}
                <label className="adminSelectLabel">
                  <Tag size={15} />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filtrar por categoria"
                  >
                    <option value="all">Todas as categorias</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Linha de Status de Filtros Ativos */}
            <div className="adminFilterStatus">
              <span>
                Mostrando <strong>{filteredProducts.length}</strong> de {products.length} produtos
              </span>
              {(productSearch || stockFilter !== "all" || categoryFilter !== "all" || priceSort !== "default") ? (
                <button
                  type="button"
                  className="adminClearFiltersBtn"
                  onClick={() => {
                    setProductSearch("");
                    setStockFilter("all");
                    setCategoryFilter("all");
                    setPriceSort("default");
                  }}
                >
                  <X size={14} />
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>

          {/* LISTA DE PRODUTOS ERGONÔMICA */}
          <div className="adminProductsList">
            {filteredProducts.map((product) => {
              const effectivePrice = product.preco_desconto ?? product.preco_normal;
              const isOut = product.estoque_qtd <= 0;
              return (
                <article
                  className={`adminProductCard${isOut ? " isOutOfStock" : ""}${!product.ativo ? " isInactive" : ""}`}
                  key={product.id}
                >
                  <img
                    src={product.fotos[0] || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80"}
                    alt={product.nome}
                    className="adminProductThumb"
                    loading="lazy"
                  />
                  <div className="adminProductDetails">
                    <div className="adminProductHeader">
                      <strong className="adminProductName">{product.nome}</strong>
                      <span className="adminProductCategory">{product.categoria}</span>
                    </div>

                    <div className="adminProductMeta">
                      <div className="adminProductPrice">
                        <strong className="priceCurrent">{formatMoney(effectivePrice)}</strong>
                        {product.preco_desconto ? (
                          <small className="priceOld">{formatMoney(product.preco_normal)}</small>
                        ) : null}
                        {product.preco_pix ? (
                          <span className="pricePixTag">Pix: {formatMoney(product.preco_pix)}</span>
                        ) : null}
                      </div>

                      <div className="adminProductBadges">
                        <span className={`stockStatusBadge ${isOut ? "out" : "in"}`}>
                          {isOut ? "🔴 Esgotado (0 un.)" : `🟢 ${product.estoque_qtd} un.`}
                        </span>
                        <span className={`activeStatusBadge ${product.ativo ? "active" : "inactive"}`}>
                          {product.ativo ? "✓ Ativo" : "✕ Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="adminProductActions">
                    <button
                      type="button"
                      className="adminActionBtn edit"
                      aria-label={`Editar ${product.nome}`}
                      onClick={() => startEditingProduct(product)}
                    >
                      <Pencil size={16} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className="adminActionBtn delete"
                      aria-label={`Remover ${product.nome}`}
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}

            {!filteredProducts.length ? (
              <div className="adminEmptyList">
                <Package size={40} className="emptyIcon" />
                <p>Nenhum produto encontrado com os filtros selecionados.</p>
                <button
                  type="button"
                  className="primaryButton emptyResetBtn"
                  onClick={() => {
                    setProductSearch("");
                    setStockFilter("all");
                    setCategoryFilter("all");
                    setPriceSort("default");
                  }}
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* SEÇÃO EDITOR (NOVO / EDITAR) */}
      {(activeTab === "editor" || activeTab === "all") && (
        <section className="adminSection productEditor">
          <div className="editorTopActions">
            <button
              type="button"
              className="adminBackToListBtn"
              onClick={() => setActiveTab("products")}
            >
              <ArrowLeft size={16} /> Voltar para lista de produtos
            </button>
            {productForm.id ? (
              <span className="editingNotice">Editando produto existente</span>
            ) : null}
          </div>

          <div className="sectionHeading">
            <Pencil size={20} />
            <h2>{productForm.id ? `Editar: ${productForm.nome || "Produto"}` : "Novo produto"}</h2>
          </div>

          <form onSubmit={saveProduct} className="adminForm">
            <label>
              Nome do produto
              <input
                value={productForm.nome}
                onChange={(event) => setProductForm({ ...productForm, nome: event.target.value })}
                placeholder="Ex: Batom Matte Velvet Rosa"
                required
              />
            </label>
            <label>
              Categoria
              <select
                value={productForm.categoria}
                onChange={(event) => setProductForm({ ...productForm, categoria: event.target.value as Category })}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="formColumns">
              <label>
                Preço normal (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.preco_normal}
                  onChange={(event) => setProductForm({ ...productForm, preco_normal: event.target.value })}
                  placeholder="0,00"
                  required
                />
              </label>
              <label>
                Preço com desconto (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.preco_desconto}
                  onChange={(event) => setProductForm({ ...productForm, preco_desconto: event.target.value })}
                  placeholder="Opcional"
                />
              </label>
              <label>
                Preço Pix (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.preco_pix}
                  onChange={(event) => setProductForm({ ...productForm, preco_pix: event.target.value })}
                  placeholder="Opcional"
                />
              </label>
              <label>
                Quantidade em estoque
                <input
                  type="number"
                  min="0"
                  value={productForm.estoque_qtd}
                  onChange={(event) => setProductForm({ ...productForm, estoque_qtd: event.target.value })}
                  required
                />
              </label>
            </div>

            <label>
              Fotos (URLs linha a linha)
              <textarea
                value={productForm.fotosText}
                onChange={(event) => setProductForm({ ...productForm, fotosText: event.target.value })}
                placeholder="https://... (ou envie uma imagem pelo botão abaixo)"
                rows={3}
              />
            </label>

            {productForm.fotosText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).length > 0 ? (
              <div className="adminPhotosPreview">
                <span className="photosPreviewLabel">
                  Fotos cadastradas ({productForm.fotosText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).length}):
                </span>
                <div className="photosPreviewList">
                  {productForm.fotosText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="photoPreviewItem">
                      <img src={url} alt={`Foto ${idx + 1}`} />
                      <button
                        type="button"
                        className="photoPreviewRemove"
                        onClick={() => removePhotoByIndex(idx)}
                        aria-label={`Remover foto ${idx + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <label>
              Descrição detalhada
              <textarea
                value={productForm.descricao}
                onChange={(event) => setProductForm({ ...productForm, descricao: event.target.value })}
                maxLength={2000}
                rows={3}
                placeholder="Descrição exibida na visão rápida do produto"
              />
            </label>

            <div className="fileRow">
              <label className="fileButton">
                <Upload size={16} />
                {uploading ? "Enviando imagem..." : "Enviar foto do celular/PC"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => uploadPhoto(event.target.files?.[0])}
                  disabled={uploading}
                />
              </label>
              <label className="toggleRow">
                <input
                  type="checkbox"
                  checked={productForm.ativo}
                  onChange={(event) => setProductForm({ ...productForm, ativo: event.target.checked })}
                />
                <span>Produto Ativo na loja</span>
              </label>
            </div>

            <div className="adminButtonRow">
              <button className="primaryButton saveProductBtn" disabled={savingProduct}>
                <Save size={18} />
                {savingProduct ? "Salvando..." : "Salvar produto"}
              </button>
              {productForm.id ? (
                <button
                  type="button"
                  className="adminCancelBtn"
                  onClick={() => {
                    setProductForm(emptyProductForm);
                    setActiveTab("products");
                  }}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>
      )}

      {/* SEÇÃO PEDIDOS */}
      {(activeTab === "orders" || activeTab === "all") && (
        <section className="adminSection ordersSection">
          <div className="sectionHeading between">
            <div className="headingTitle">
              <ClipboardList size={20} />
              <h2>Pedidos ({filteredOrders.length}{filteredOrders.length !== orders.length ? ` de ${orders.length}` : ""})</h2>
            </div>
          </div>

          <div className="adminOrderFilters">
            <div className="adminSearchInputWrap">
              <Search size={16} className="adminSearchIcon" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar por cliente, WhatsApp ou ID..."
                className="adminSearchInput small"
              />
              {orderSearch ? (
                <button
                  type="button"
                  className="adminSearchClear"
                  onClick={() => setOrderSearch("")}
                  aria-label="Limpar busca de pedidos"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <label className="adminSelectLabel">
              <Filter size={15} />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ordersTable">
            {filteredOrders.map((order) => (
              <article className="orderCard" key={order.id}>
                <div className="orderCardHeader">
                  <div className="orderCardHeaderLeft">
                    <span className="orderBadgeId">#{order.id.replace(/^#/, "")}</span>
                    <span className={`orderStatusPill ${order.status === COMPLETED_ORDER_STATUS ? "completed" : "pending"}`}>
                      {order.status === COMPLETED_ORDER_STATUS ? "✓ Concluído" : "⏳ Em andamento"}
                    </span>
                    {order.criado_em ? (
                      <span className="orderDateText">{formatOrderDate(order.criado_em)}</span>
                    ) : null}
                  </div>
                  <div className="orderCardTotal">
                    {formatMoney(order.valor_total)}
                  </div>
                </div>

                <div className="orderCardCustomer">
                  <div className="orderCustomerInfo">
                    <strong className="orderCustomerName">{order.cliente_nome}</strong>
                    {order.cliente_email ? (
                      <span className="orderCustomerEmail">{order.cliente_email}</span>
                    ) : null}
                  </div>
                  {order.cliente_whatsapp ? (
                    <a
                      href={formatWhatsappLink(order.cliente_whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="orderWhatsappBtn"
                      title={`Conversar com ${order.cliente_nome} no WhatsApp`}
                    >
                      <WhatsApp size={16} />
                      <span>{order.cliente_whatsapp}</span>
                    </a>
                  ) : null}
                </div>

                {(order.forma_entrega || order.forma_pagamento) && (
                  <div className="orderCardTags">
                    {order.forma_entrega ? (
                      <span className="orderTag delivery">
                        📦 {DELIVERY_LABELS[order.forma_entrega] || order.forma_entrega}
                      </span>
                    ) : null}
                    {order.forma_pagamento ? (
                      <span className="orderTag payment">
                        💳 {PAYMENT_LABELS[order.forma_pagamento] || order.forma_pagamento}
                      </span>
                    ) : null}
                  </div>
                )}

                <div className="orderCardItems">
                  <div className="orderItemsLabel">Itens do pedido ({order.itens.reduce((acc, it) => acc + (it.qtd || 1), 0)}):</div>
                  <ul className="orderItemsList">
                    {order.itens.map((item) => (
                      <li key={`${order.id}-${item.produto_id}`} className="orderItemRow">
                        <span className="orderItemQty">{item.qtd}x</span>
                        <span className="orderItemName">{item.nome}</span>
                        <span className="orderItemPrice">{formatMoney((item.preco_unit || 0) * item.qtd)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.observacoes ? (
                  <div className="orderCardNotes">
                    <strong>Obs:</strong> <span>{order.observacoes}</span>
                  </div>
                ) : null}

                <div className="orderCardFooter">
                  <div className="orderStatusSelectWrap">
                    <label htmlFor={`status-${order.id}`} className="orderStatusLabel">Status:</label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}
                      className="orderStatusSelect"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    aria-label={`Excluir pedido ${order.id}`}
                    className="orderDeleteBtn"
                    onClick={() => deleteOrder(order.id)}
                  >
                    <Trash2 size={16} />
                    <span>Excluir</span>
                  </button>
                </div>
              </article>
            ))}
            {!filteredOrders.length ? (
              <p className="emptyState">Nenhum pedido encontrado.</p>
            ) : null}
          </div>
        </section>
      )}

      {/* SEÇÃO BANNERS */}
      {(activeTab === "banners" || activeTab === "all") && (
        <section className="adminSection bannersSection">
          <div className="sectionHeading">
            <Settings size={20} />
            <h2>Banners da home ({siteConfig.banners.length})</h2>
          </div>
          <p className="adminHint">
            Envie as imagens do carrossel da home (recomendado 1600x800px, formato paisagem). Eles giram automaticamente na ordem abaixo.
          </p>
          <div className="bannerEditor">
            {siteConfig.banners.map((banner, index) => (
              <div className="bannerCard" key={banner.id}>
                <img src={banner.imagem} alt="" />
                <div className="bannerCardActions">
                  <button
                    type="button"
                    onClick={() => moveBanner(index, -1)}
                    disabled={index === 0}
                    aria-label="Mover banner para cima"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBanner(index, 1)}
                    disabled={index === siteConfig.banners.length - 1}
                    aria-label="Mover banner para baixo"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBanner(index)}
                    aria-label="Remover banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <label className="bannerUpload">
              <Upload size={20} />
              <span>{bannerUploading ? "Enviando..." : "Adicionar banner"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => uploadBanner(event.target.files?.[0])}
                disabled={bannerUploading}
                hidden
              />
            </label>
          </div>
          <button type="button" className="primaryButton bannerSave" onClick={saveBanners}>
            <Save size={18} />
            Salvar banners
          </button>
        </section>
      )}

    </main>
  );
}
