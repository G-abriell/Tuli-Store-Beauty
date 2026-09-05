"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Upload
} from "lucide-react";
import { CATEGORIES, ORDER_STATUSES } from "@/lib/constants";
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
      setMessage("Produto salvo.");
      await loadAdminData();
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
      const base64 = await fileToDataUrl(file);
      const response = await fetch("/api/admin/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
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
          <button type="button" onClick={loadAdminData}>
            <RefreshCw size={18} />
            Atualizar
          </button>
          <button type="button" onClick={logout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </header>

      {message ? <p className="adminMessage">{message}</p> : null}

      <section className="adminGrid">
        <div className="adminSection productEditor">
          <div className="sectionHeading">
            <Pencil size={20} />
            <h2>{productForm.id ? "Editar produto" : "Novo produto"}</h2>
          </div>
          <form onSubmit={saveProduct} className="adminForm">
            <label>
              Nome
              <input value={productForm.nome} onChange={(event) => setProductForm({ ...productForm, nome: event.target.value })} required />
            </label>
            <label>
              Categoria
              <select value={productForm.categoria} onChange={(event) => setProductForm({ ...productForm, categoria: event.target.value as Category })}>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="formColumns">
              <label>
                Preço normal
                <input type="number" step="0.01" min="0" value={productForm.preco_normal} onChange={(event) => setProductForm({ ...productForm, preco_normal: event.target.value })} required />
              </label>
              <label>
                Preço desconto
                <input type="number" step="0.01" min="0" value={productForm.preco_desconto} onChange={(event) => setProductForm({ ...productForm, preco_desconto: event.target.value })} />
              </label>
              <label>
                Preço Pix
                <input type="number" step="0.01" min="0" value={productForm.preco_pix} onChange={(event) => setProductForm({ ...productForm, preco_pix: event.target.value })} />
              </label>
              <label>
                Estoque
                <input type="number" min="0" value={productForm.estoque_qtd} onChange={(event) => setProductForm({ ...productForm, estoque_qtd: event.target.value })} required />
              </label>
            </div>
            <label>
              Fotos
              <textarea value={productForm.fotosText} onChange={(event) => setProductForm({ ...productForm, fotosText: event.target.value })} />
            </label>
            <label>
              Descrição
              <textarea value={productForm.descricao} onChange={(event) => setProductForm({ ...productForm, descricao: event.target.value })} maxLength={2000} placeholder="Descrição exibida na visão rápida do produto" />
            </label>
            <div className="fileRow">
              <label className="fileButton">
                <Upload size={16} />
                {uploading ? "Enviando" : "Enviar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => uploadPhoto(event.target.files?.[0])}
                  disabled={uploading}
                />
              </label>
              <label className="toggleRow">
                <input type="checkbox" checked={productForm.ativo} onChange={(event) => setProductForm({ ...productForm, ativo: event.target.checked })} />
                Ativo
              </label>
            </div>
            <div className="adminButtonRow">
              <button className="primaryButton" disabled={savingProduct}>
                <Save size={18} />
                {savingProduct ? "Salvando" : "Salvar produto"}
              </button>
              {productForm.id ? (
                <button type="button" onClick={() => setProductForm(emptyProductForm)}>
                  <Plus size={18} />
                  Novo
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="adminSection">
          <div className="sectionHeading">
            <Package size={20} />
            <h2>Produtos</h2>
          </div>
          <div className="adminList">
            {products.map((product) => (
              <div className="adminListRow" key={product.id}>
                <img src={product.fotos[0] || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80"} alt="" />
                <div>
                  <strong>{product.nome}</strong>
                  <span>
                    {product.categoria} - {formatMoney(product.preco_desconto ?? product.preco_normal)} - {product.estoque_qtd} un.
                  </span>
                </div>
                <button type="button" aria-label="Editar produto" onClick={() => setProductForm(productToForm(product))}>
                  <Pencil size={16} />
                </button>
                <button type="button" aria-label="Remover produto" onClick={() => deleteProduct(product.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="adminSection">
        <div className="sectionHeading">
          <ClipboardList size={20} />
          <h2>Pedidos</h2>
        </div>
        <div className="ordersTable">
          {orders.map((order) => (
            <article className="orderRow" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{order.cliente_nome}</span>
              </div>
              <div>
                <span>{order.cliente_whatsapp}</span>
                <span>{formatMoney(order.valor_total)}</span>
              </div>
              <div className="orderItems">
                {order.itens.map((item) => (
                  <span key={`${order.id}-${item.produto_id}`}>
                    {item.qtd}x {item.nome}
                  </span>
                ))}
              </div>
              <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="button" aria-label="Excluir pedido" onClick={() => deleteOrder(order.id)}>
                <Trash2 size={16} />
              </button>
            </article>
          ))}
          {!orders.length ? <p className="emptyState">Nenhum pedido encontrado.</p> : null}
        </div>
      </section>

      <section className="adminSection">
        <div className="sectionHeading">
          <Settings size={20} />
          <h2>Banners da home</h2>
        </div>
        <p className="adminHint">Envie as imagens do carrossel da home (recomendado 1600x800px, formato paisagem). Eles giram automaticamente na ordem abaixo.</p>
        <div className="bannerEditor">
          {siteConfig.banners.map((banner, index) => (
            <div className="bannerCard" key={banner.id}>
              <img src={banner.imagem} alt="" />
              <div className="bannerCardActions">
                <button type="button" onClick={() => moveBanner(index, -1)} disabled={index === 0} aria-label="Mover banner para cima"><ChevronUp size={16} /></button>
                <button type="button" onClick={() => moveBanner(index, 1)} disabled={index === siteConfig.banners.length - 1} aria-label="Mover banner para baixo"><ChevronDown size={16} /></button>
                <button type="button" onClick={() => removeBanner(index)} aria-label="Remover banner"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          <label className="bannerUpload">
            <Upload size={20} />
            <span>{bannerUploading ? "Enviando..." : "Adicionar banner"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadBanner(event.target.files?.[0])} disabled={bannerUploading} hidden />
          </label>
        </div>
        <button type="button" className="primaryButton bannerSave" onClick={saveBanners}>
          <Save size={18} />
          Salvar banners
        </button>
      </section>
    </main>
  );
}
