"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Gift,
  Heart,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  Truck,
  X
} from "lucide-react";
import { WhatsApp, Instagram } from "./Icons";
import { CookieManageLink } from "./CookieBanner";
import {
  CATEGORIES,
  DELIVERY_IDS,
  DELIVERY_LABELS,
  PAYMENT_IDS,
  PAYMENT_LABELS,
  STORE_CONTACTS
} from "@/lib/constants";
import { bestUnitPrice, formatMoney, roundMoney } from "@/lib/currency";
import { DEFAULT_SITE_CONFIG, DEMO_PRODUCTS } from "@/lib/demo-data";
import { useCookieConsent } from "@/lib/use-cookie-consent";
import type { CartItem, Category, Customer, DeliveryId, PaymentId, Product, SiteConfig } from "@/types/store";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type SortMode = "featured" | "price-asc" | "price-desc";
type ToastKind = "info" | "success" | "error";
type Toast = { id: number; kind: ToastKind; title: string; message?: string };
type MagnifierState = { productId: string; x: number; y: number } | null;
type KitTourState = { product: Product; index: number } | null;
type QuickViewState = { product: Product; index: number; qtd: number } | null;

const fallbackImage = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80";

const MARQUEE_ITEMS = [
  "Retirada gratuita na loja e no ICB/UPE",
  "Entrega por Uber Flash ou 99Entrega — frete consultado na hora",
  "Pagamento em Pix, cartão ou dinheiro",
  "Atendimento pelo WhatsApp (81) 98314-3861",
  "Pedidos finalizados pelo WhatsApp para confirmação",
  "Produtos nas faixas de R$ 5,00 e R$ 10,00"
];

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ banners: [] });
  const heroBanners = siteConfig.banners.length ? siteConfig.banners : DEFAULT_SITE_CONFIG.banners;
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "Todos">("Todos");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ nome: "", email: "", whatsapp: "" });
  const [customerErrors, setCustomerErrors] = useState<{ nome?: string; email?: string; whatsapp?: string }>({});
  const [delivery, setDelivery] = useState<DeliveryId>("retirada_loja");
  const [payment, setPayment] = useState<PaymentId>("pix");
  const [observations, setObservations] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderUrl, setSubmittedOrderUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addedModal, setAddedModal] = useState<{ product: Product; quantity: number } | null>(null);
  const addedModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [magnifier, setMagnifier] = useState<MagnifierState>(null);
  const [kitTour, setKitTour] = useState<KitTourState>(null);
  const [quickView, setQuickView] = useState<QuickViewState>(null);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const categoryPanelRef = useRef<HTMLDivElement | null>(null);
  // Timestamp (Date.now()) de quando o dropdown foi aberto pela última vez.
  // Usado no scroll-listener para ignorar scrolls que acontecem nos primeiros
  // 200ms após a abertura (ex.: scroll gerado pelo próprio toque do gatilho
  // no mobile, que pode disparar o close antes do usuário interagir com o painel).
  const dropdownOpenedAtRef = useRef<number>(0);
  const [dropdownStyles, setDropdownStyles] = useState<CSSProperties>({ visibility: "hidden" });
  const [dropdownAnimate, setDropdownAnimate] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const captchaWidget = useRef<string | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const kitDragRef = useRef<{ startX: number; startIndex: number } | null>(null);
  const heroDragRef = useRef<{ startX: number } | null>(null);
  const cartDragRef = useRef<{ startY: number; currentY: number; dragging: boolean; raf?: number } | null>(null);
  const [cartDragOffset, setCartDragOffset] = useState(0);
  const quickViewPanelRef = useRef<HTMLDivElement | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || "Endereço completo da loja a configurar";
  // Consentimento de cookies: o widget do Turnstile só renderiza se o usuário
  // consentiu com a categoria "captcha" (LGPD).
  const { consent } = useCookieConsent();
  const turnstileConsentGiven =
    consent.status === "accepted" ||
    (consent.status === "customized" && consent.captcha === true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([fetch("/api/products", { cache: "no-store" }), fetch("/api/site-config", { cache: "no-store" })]);
        if (pRes.ok) { const d = (await pRes.json()) as { products?: Product[]; demo?: boolean }; if (mounted) { if (d.products?.length) setProducts(d.products); else if (d.demo) setProducts(DEMO_PRODUCTS); } }
        if (cRes.ok) { const d = (await cRes.json()) as { config?: SiteConfig; demo?: boolean }; if (mounted) { if (d.config?.banners?.length) setSiteConfig(d.config); else if (d.demo) setSiteConfig(DEFAULT_SITE_CONFIG); } }
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { setIsTouch(isTouchDevice()); }, []);

  useEffect(() => {
    let raf = 0;
    // Histerese: dois limiares distintos evitam o "tremor" quando o usuário rola
    // perto do ponto de transição. Sem histerese (limiar único), o header
    // alternaria entre full e compact dezenas de vezes por segundo durante
    // um scroll natural, causando o bug visual "tremendo".
    //
    // A zona morta precisa ser MAIOR que a diferença de altura do documento
    // entre full e compact (~98px no mobile, porque o search group recolhe).
    // Se a zona morta for menor que essa diferença, o navegador recalcula
    // scrollY quando o topbar compacta, e o novo scrollY cai fora da zona
    // morta, causando o loop de feedback.
    //   - Ativa compacto: scrollY > 150 (rolou bem para baixo)
    //   - Desativa compacto: scrollY < 10 (voltou quase ao topo)
    // Zona morta: 10-150px (140px > 98px de layout shift) — elimina o loop.
    const fn = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled((prev) => {
          if (prev) return y > 10;    // já compacto: só volta a full se subir muito
          return y > 150;             // full: só vira compacto se rolar bem
        });
      });
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => { window.removeEventListener("scroll", fn); if (raf) window.cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { if (!heroBanners.length || bannerPaused) return; const i = window.setInterval(() => setActiveBannerIndex((c) => (c + 1) % heroBanners.length), 6000); return () => window.clearInterval(i); }, [heroBanners.length, bannerPaused]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileConsentGiven || !captchaRef.current) return;
    const render = () => {
      if (!window.turnstile || !captchaRef.current || captchaWidget.current) return;
      captchaWidget.current = window.turnstile.render(captchaRef.current, { sitekey: turnstileSiteKey, callback: setTurnstileToken, "expired-callback": () => setTurnstileToken("") });
      window.clearInterval(i);
    };
    render();
    const i = window.setInterval(render, 400);
    return () => window.clearInterval(i);
  }, [turnstileSiteKey, turnstileConsentGiven]);

  useEffect(() => {
    const root = revealRef.current; if (!root) return;
    const obs = new IntersectionObserver((e) => { for (const entry of e) { if (entry.isIntersecting) { entry.target.classList.add("revealed"); obs.unobserve(entry.target); } } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [products, siteConfig, activeBannerIndex, category, query, sortMode, loading]);

  useEffect(() => {
    const t = toastTimersRef.current;
    return () => {
      t.forEach((v) => clearTimeout(v));
      t.clear();
      if (addedModalTimerRef.current) clearTimeout(addedModalTimerRef.current);
    };
  }, []);

  // Um único efeito controla o overflow do body — dois efeitos separados
  // sobrescreviam um ao outro na limpeza quando cartOpen e quickView
  // alternavam em sequência rápida.
  useEffect(() => {
    document.body.style.overflow = (cartOpen || !!quickView || !!addedModal) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen, quickView, addedModal]);

  useEffect(() => {
    if (!quickView) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setQuickView(null);
      setMagnifier(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickView]);

  useEffect(() => {
    if (!addedModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (addedModalTimerRef.current) clearTimeout(addedModalTimerRef.current);
        setAddedModal(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addedModal]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const isOutsideTrigger = categoryMenuRef.current && !categoryMenuRef.current.contains(target);
      const isOutsidePanel = categoryPanelRef.current && !categoryPanelRef.current.contains(target);
      if (isOutsideTrigger && isOutsidePanel) {
        setCategoryMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCategoryMenuOpen(false);
    }
    function onScroll() {
      // Guard: ignora scrolls nos primeiros 200ms após a abertura do dropdown.
      // No mobile, o toque no botão gatilho pode gerar um micro-scroll que
      // fecharia o painel antes do usuário conseguir selecionar um item.
      // 200ms é suficiente para absorver o scroll inicial sem atrasar a resposta
      // a scrolls reais do usuário.
      if (Date.now() - dropdownOpenedAtRef.current < 200) return;
      setCategoryMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [categoryMenuOpen]);

  function handleMagnifierMove(e: React.MouseEvent<HTMLDivElement>, p: Product) { if (isTouch) return; const rect = e.currentTarget.getBoundingClientRect(); setMagnifier({ productId: p.id, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }); }
  function handleMagnifierLeave() { setMagnifier(null); }
  function goToBanner(delta: number) {
    const total = heroBanners.length;
    if (!total) return;
    setActiveBannerIndex((c) => (c + delta + total) % total);
  }
  function handleHeroDragStart(e: React.TouchEvent<HTMLDivElement>) { heroDragRef.current = { startX: e.touches[0].clientX }; setBannerPaused(true); }
  function handleHeroDragEnd(e: React.TouchEvent<HTMLDivElement>) {
    const d = heroDragRef.current; heroDragRef.current = null; setBannerPaused(false);
    if (!d) return;
    const delta = e.changedTouches[0].clientX - d.startX;
    if (Math.abs(delta) < 40) return;
    goToBanner(delta < 0 ? 1 : -1);
  }
  function openKitTour(p: Product) { if (!p.fotos.length) return; setKitTour({ product: p, index: 0 }); }
  function closeKitTour() { setKitTour(null); kitDragRef.current = null; }
  function handleCartDragStart(e: React.TouchEvent<HTMLButtonElement>) {
    const y = e.touches[0].clientY;
    cartDragRef.current = { startY: y, currentY: y, dragging: true };
  }
  function handleCartDragMove(e: React.TouchEvent<HTMLButtonElement>) {
    const d = cartDragRef.current;
    if (!d || !d.dragging) return;
    d.currentY = e.touches[0].clientY;
    // Throttle com rAF para o deslizar ficar suave (sem re-render a cada touchmove).
    if (d.raf) return;
    d.raf = window.requestAnimationFrame(() => {
      d.raf = 0;
      if (!cartDragRef.current) return;
      const delta = Math.max(0, d.currentY - d.startY);
      setCartDragOffset(delta);
    });
  }
  function handleCartDragEnd() {
    const d = cartDragRef.current;
    if (!d) return;
    if (d.raf) { window.cancelAnimationFrame(d.raf); d.raf = 0; }
    const delta = d.currentY - d.startY;
    cartDragRef.current = null;
    setCartDragOffset(0);
    if (delta > 80) setCartOpen(false);
  }
  function setKitIndex(n: number, t: number) { setKitTour((c) => { if (!c) return c; return { ...c, index: Math.max(0, Math.min(n, t - 1)) }; }); }
  function handleKitDragStart(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) { if (!kitTour) return; const x = "touches" in e ? e.touches[0].clientX : e.clientX; kitDragRef.current = { startX: x, startIndex: kitTour.index }; }
  function handleKitDragMove(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) { const d = kitDragRef.current; if (!d || !kitTour) return; const x = "touches" in e ? e.touches[0].clientX : e.clientX; setKitIndex(d.startIndex - Math.round((x - d.startX) / 90), kitTour.product.fotos.length); }
  function handleKitDragEnd() { kitDragRef.current = null; }
  function openQuickView(p: Product) { setQuickView({ product: p, index: 0, qtd: 1 }); setMagnifier(null); }
  function closeQuickView() { setQuickView(null); setMagnifier(null); }
  function setQuickViewIndex(n: number, total: number) { setQuickView((c) => { if (!c) return c; return { ...c, index: Math.max(0, Math.min(n, Math.max(0, total - 1))) }; }); setMagnifier(null); }
  function setQuickViewQtd(n: number, max: number) { setQuickView((c) => { if (!c) return c; return { ...c, qtd: Math.max(1, Math.min(n, Math.max(1, max))) }; }); }
  function handleQuickViewOverlayClick(e: React.MouseEvent<HTMLDivElement>) { if (e.target === e.currentTarget) closeQuickView(); }
  function handleQuickViewShare(p: Product) { const url = typeof window !== "undefined" ? `${window.location.origin}/?p=${encodeURIComponent(p.id)}` : ""; if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title: p.nome, url }).catch(() => undefined); } else if (typeof navigator !== "undefined" && navigator.clipboard) { navigator.clipboard.writeText(url).catch(() => undefined); } }
  function handleQuickViewWhatsapp(p: Product) {
    const msg = [
      `✨ *Olá! Vi este produto na Tuli Store Beauty e gostaria de tirar dúvidas:*`,
      "",
      `🛍️ *${p.nome}* (Ref. ${p.id})`,
      `💰 *Valor:* ${formatMoney(bestUnitPrice(p, payment))}`,
      "",
      `Podem me ajudar? 🥰`
    ].join("\n");
    const url = `https://api.whatsapp.com/send?phone=${STORE_CONTACTS.whatsappDigits}&text=${encodeURIComponent(msg)}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  }
  function pushToast(kind: ToastKind, title: string, message?: string) { const id = ++toastIdRef.current; setToasts((c) => [...c, { id, kind, title, message }]); toastTimersRef.current.set(id, setTimeout(() => dismissToast(id), 3400)); }
  function dismissToast(id: number) { const t = toastTimersRef.current.get(id); if (t) { clearTimeout(t); toastTimersRef.current.delete(id); } setToasts((c) => c.filter((t) => t.id !== id)); }

  useLayoutEffect(() => {
    if (!categoryMenuOpen || !categoryPanelRef.current || !categoryTriggerRef.current) {
      setDropdownStyles({ visibility: "hidden" });
      setDropdownAnimate(false);
      return;
    }
    // Registra o momento de abertura para o scroll-guard (evita fechar o painel
    // por um scroll gerado pelo próprio toque do botão gatilho no mobile).
    dropdownOpenedAtRef.current = Date.now();
    const triggerRect = categoryTriggerRef.current.getBoundingClientRect();
    // panelRect removido: não era usado para cálculo algum (o centramento é feito
    // via transform: translateX(-50%) pelo CSS, não precisa da largura do painel).
    const isMobile = window.innerWidth <= 720;
    const top = triggerRect.bottom + 8;
    let left: number;
    let transform: string | undefined;
    if (isMobile) {
      left = 16;
      transform = undefined;
    } else {
      left = triggerRect.left + triggerRect.width / 2;
      transform = "translateX(-50%)";
    }
    setDropdownStyles({
      position: "fixed",
      top,
      left,
      transform,
      zIndex: 9999,
      visibility: "visible",
    });
    requestAnimationFrame(() => setDropdownAnimate(true));
  }, [categoryMenuOpen]);

  const filteredProducts = useMemo(() => {
    const nq = normalizeText(query);
    return products.filter((p) => {
      const mc = category === "Todos" || p.categoria === category;
      const mq = !nq
        || normalizeText(p.nome).includes(nq)
        || normalizeText(p.categoria).includes(nq)
        || (p.descricao ? normalizeText(p.descricao).includes(nq) : false);
      return p.ativo && mc && mq;
    }).sort((a, b) => { if (sortMode === "price-asc") return bestUnitPrice(a, payment) - bestUnitPrice(b, payment); if (sortMode === "price-desc") return bestUnitPrice(b, payment) - bestUnitPrice(a, payment); return a.nome.localeCompare(b.nome, "pt-BR"); });
  }, [category, payment, products, query, sortMode]);
  const subtotal = useMemo(() => roundMoney(cart.reduce((t, i) => t + bestUnitPrice(i.product, payment) * i.qtd, 0)), [cart, payment]);
  const total = roundMoney(subtotal);
  const cartQuantity = cart.reduce((t, i) => t + i.qtd, 0);

  function cartQty(pid: string) { return cart.find((i) => i.product.id === pid)?.qtd ?? 0; }
  function handleNomeChange(v: string) { setCustomer((c) => ({ ...c, nome: v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "") })); setCustomerErrors((e) => ({ ...e, nome: undefined })); }
  function handleWhatsappChange(v: string) { const d = v.replace(/\D/g, "").slice(0, 11); let m = d; if (d.length > 2) m = `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length > 7) m = `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`; setCustomer((c) => ({ ...c, whatsapp: m })); setCustomerErrors((e) => ({ ...e, whatsapp: undefined })); }
  function handleEmailChange(v: string) { setCustomer((c) => ({ ...c, email: v })); setCustomerErrors((e) => ({ ...e, email: undefined })); }

  const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

  function validateCustomer(): boolean {
    const errors: { nome?: string; email?: string; whatsapp?: string } = {};
    const nomeTrim = customer.nome.trim();
    if (!nomeTrim) errors.nome = "Informe seu nome completo.";
    else if (nomeTrim.length < 5) errors.nome = "Digite o nome completo (mínimo 5 letras).";
    else if (!nomeTrim.includes(" ")) errors.nome = "Informe nome e sobrenome.";

    const emailTrim = customer.email.trim();
    if (!emailTrim) errors.email = "Informe seu e-mail.";
    else if (!EMAIL_REGEX.test(emailTrim)) errors.email = "E-mail incompleto ou inválido (ex: nome@exemplo.com).";

    const digits = customer.whatsapp.replace(/\D/g, "");
    if (!digits) errors.whatsapp = "Informe seu WhatsApp.";
    else if (digits.length < 10) errors.whatsapp = "Número incompleto — inclua DDD + número.";

    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function addToCart(product: Product, quantidade: number = 1) {
    if (product.estoque_qtd <= 0) return;
    setSubmittedOrderUrl(null);
    const want = Math.max(1, Math.min(quantidade, product.estoque_qtd));
    setCart((c) => {
      const e = c.find((i) => i.product.id === product.id);
      if (!e) return [...c, { product, qtd: want }];
      const nextQ = Math.min(e.qtd + want, product.estoque_qtd);
      if (nextQ === e.qtd) return c;
      return c.map((i) => (i.product.id === product.id ? { ...i, qtd: nextQ } : i));
    });

    if (addedModalTimerRef.current) clearTimeout(addedModalTimerRef.current);
    setAddedModal({ product, quantity: want });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 1200);

    addedModalTimerRef.current = setTimeout(() => {
      setAddedModal(null);
    }, 3800);
  }

  function updateCart(pid: string, nq: number) { setCart((c) => c.map((i) => { if (i.product.id !== pid) return i; return { ...i, qtd: Math.max(0, Math.min(nq, i.product.estoque_qtd)) }; }).filter((i) => i.qtd > 0)); }

  function handleCartIconClick() { if (isTouch || window.innerWidth <= 1080) setCartOpen(true); else document.querySelector(".cartPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }

  const closeAddedModal = () => {
    if (addedModalTimerRef.current) {
      clearTimeout(addedModalTimerRef.current);
      addedModalTimerRef.current = null;
    }
    setAddedModal(null);
  };

  const handleViewCartFromModal = () => {
    closeAddedModal();
    handleCartIconClick();
  };

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCheckoutMessage("");
    if (!cart.length) { setCheckoutMessage("Adicione ao menos um produto na sacola."); return; }
    if (!validateCustomer()) { setCheckoutMessage("Confira os campos destacados abaixo."); return; }
    if (turnstileSiteKey && turnstileConsentGiven && !turnstileToken) { setCheckoutMessage("Confirme a verificação do checkout."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items: cart.map((i) => ({ productId: i.product.id, qtd: i.qtd })), forma_entrega: delivery, forma_pagamento: payment, observacoes: observations, turnstileToken }) });
      const data = (await res.json()) as { whatsappUrl?: string; whatsappAppUrl?: string; error?: string };
      if (!res.ok || !data.whatsappUrl) throw new Error(data.error || "Erro ao finalizar pedido");
      pushToast("success", "Pedido finalizado! 🎉", "Abrindo WhatsApp com seus itens...");
      setCart([]);
      setObservations("");
      setSubmittedOrderUrl(data.whatsappUrl);
      const url = data.whatsappUrl;
      // Redirecionamento oficial via api.whatsapp.com preserva 100% dos emojis UTF-8
      // Mantém o botão desabilitado (submitting=true) até o redirecionamento acontecer
      window.setTimeout(() => { if (url) window.location.href = url; }, 700);
    } catch (err) {
      setCheckoutMessage(err instanceof Error ? err.message : "Não foi possível finalizar o pedido.");
      if (captchaWidget.current) { window.turnstile?.reset(captchaWidget.current); setTurnstileToken(""); }
      setSubmitting(false);
    }
  }

  const triggerBubble = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const clickX = e.clientX > 0 ? e.clientX - rect.left : rect.width / 2;
    const clickY = e.clientY > 0 ? e.clientY - rect.top : rect.height / 2;
    const x = clickX - size / 2;
    const y = clickY - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "bubbleRipple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const renderCart = (isDrawer: boolean) => (
    <form className="cartCheckoutForm" onSubmit={submitOrder}>
      {/* HEADER FIXO */}
      <div className="cartHeader">
        <div className="cartHeaderInfo">
          <span>{isDrawer ? "Sua Sacola" : "Sacola"}</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <div className="cartHeaderActions">
          <ShoppingBag size={20} />
          {isDrawer ? (
            <button
              type="button"
              className="cartDrawerClose"
              onClick={() => setCartOpen(false)}
              aria-label="Fechar sacola"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* ÚNICO CONTAINER DE SCROLL */}
      <div className="cartScrollBody">
        <div className="cartItems">
          {cart.length ? (
            cart.map((item) => (
              <div className="cartRow" key={item.product.id}>
                <img src={item.product.fotos[0] || fallbackImage} alt="" />
                <div className="cartRowBody">
                  <strong>{item.product.nome}</strong>
                  <span>{formatMoney(bestUnitPrice(item.product, payment))}</span>
                  <div className="quantityControls">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      onClick={() => updateCart(item.product.id, item.qtd - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span>{item.qtd}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() => updateCart(item.product.id, item.qtd + 1)}
                      disabled={item.qtd >= item.product.estoque_qtd}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remover"
                      onClick={() => updateCart(item.product.id, 0)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : submittedOrderUrl ? (
            <div className="cartSuccessBox">
              <div className="cartSuccessEmoji">✨🛍️✨</div>
              <h4>Pedido Gerado com Sucesso!</h4>
              <p>Os dados do seu pedido estão prontos para envio.</p>
              <a
                href={submittedOrderUrl}
                className="cartSuccessWhatsappLink"
              >
                <WhatsApp size={18} />
                <span>Abrir no WhatsApp</span>
              </a>
              <small>Se o WhatsApp não abrir automaticamente em instantes, toque no botão acima.</small>
            </div>
          ) : (
            <p className="emptyState">Sua sacola está vazia.</p>
          )}
        </div>

        <div className="cartCheckoutFields">
          <div className="formGroup">
            <label>
              Nome completo
              <input
                value={customer.nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                onBlur={validateCustomer}
                aria-invalid={Boolean(customerErrors.nome)}
                className={customerErrors.nome ? "fieldInvalid" : ""}
                required
                minLength={5}
                autoComplete="name"
              />
              {customerErrors.nome ? <span className="fieldError">{customerErrors.nome}</span> : null}
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={customer.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={validateCustomer}
                aria-invalid={Boolean(customerErrors.email)}
                className={customerErrors.email ? "fieldInvalid" : ""}
                required
                autoComplete="email"
              />
              {customerErrors.email ? <span className="fieldError">{customerErrors.email}</span> : null}
            </label>
            <label>
              WhatsApp
              <input
                value={customer.whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                onBlur={validateCustomer}
                aria-invalid={Boolean(customerErrors.whatsapp)}
                className={customerErrors.whatsapp ? "fieldInvalid" : ""}
                required
                minLength={10}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(00) 0 0000-0000"
              />
              {customerErrors.whatsapp ? <span className="fieldError">{customerErrors.whatsapp}</span> : null}
            </label>
          </div>

          <div className="optionGroup">
            <span>Entrega</span>
            {DELIVERY_IDS.map((o) => (
              <button
                key={o}
                type="button"
                className={`optionButton ${delivery === o ? "selected" : ""}`}
                onClick={(e) => {
                  triggerBubble(e);
                  setDelivery(o);
                }}
              >
                <span className="optionIcon">
                  {o === "entrega_app" ? <Truck size={18} /> : <Store size={18} />}
                </span>
                <span className="optionText">
                  {DELIVERY_LABELS[o]}
                  <small>
                    {o === "retirada_loja"
                      ? storeAddress
                      : o === "retirada_icb"
                      ? "Entrar em contato para agendar"
                      : "Frete a consultar"}
                  </small>
                </span>
                <span className="optionRadio" aria-hidden="true">
                  <span className="optionRadioInner" />
                </span>
              </button>
            ))}
          </div>

          <div className="optionGroup compact">
            <span>Pagamento</span>
            {PAYMENT_IDS.map((o) => (
              <button
                key={o}
                type="button"
                className={`optionButton ${payment === o ? "selected" : ""}`}
                onClick={(e) => {
                  triggerBubble(e);
                  setPayment(o);
                }}
              >
                <span>{PAYMENT_LABELS[o]}</span>
              </button>
            ))}
          </div>

          <label className="notesField">
            Observações
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              maxLength={500}
              placeholder="Alguma observação para seu pedido?"
            />
          </label>

          {turnstileSiteKey && turnstileConsentGiven ? <div ref={captchaRef} className="captchaSlot" /> : null}
        </div>
      </div>

      {/* FOOTER FIXO */}
      <div className="cartFixedFooter">
        {submittedOrderUrl ? (
          <a
            href={submittedOrderUrl}
            className="checkoutButton"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            <WhatsApp size={18} />
            Abrir Pedido no WhatsApp
          </a>
        ) : (
          <>
            <div className="totals">
              <span>Subtotal <strong>{formatMoney(subtotal)}</strong></span>
              <span>Total <strong>{formatMoney(total)}</strong></span>
            </div>
            {checkoutMessage ? <p className="errorText">{checkoutMessage}</p> : null}
            <button
              type="submit"
              className="checkoutButton"
              disabled={submitting || !cart.length}
            >
              <WhatsApp size={18} />
              {submitting ? "Finalizando..." : "Finalizar pelo WhatsApp"}
            </button>
          </>
        )}
      </div>
    </form>
  );

  return (
    <main className="storeShell" ref={revealRef}>
      <div className="marqueeBar" aria-hidden="true"><div className="marqueeTrack">{MARQUEE_ITEMS.map((t, i) => <span key={`a${i}`} className="marqueeItem">{t}</span>)}{MARQUEE_ITEMS.map((t, i) => <span key={`b${i}`} className="marqueeItem">{t}</span>)}</div></div>

      <header className={`topbar${scrolled ? " compact" : ""}`}>
        <a className="brand" href="/"><span className="brandLogo" aria-hidden="true"><img src="/logo-header.jpeg" alt="" width={40} height={40} /></span><span className="brandText"><strong>Tuli Store Beauty</strong><small>Cosméticos e acessórios</small></span></a>
        <div className="headerSearchGroup">
          <label className="headerSearch"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." /></label>
          <div className="categoryDropdownWrap" ref={categoryMenuRef}>
            <button
              type="button"
              ref={categoryTriggerRef}
              className={`headerFilter categoryDropdownTrigger${category !== "Todos" ? " selected" : ""}`}
              onClick={(e) => {
                triggerBubble(e);
                setCategoryMenuOpen((v) => !v);
              }}
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              aria-label="Filtrar por categoria"
            >
              <Filter size={16} />
              <span className="categoryDropdownLabel">{category === "Todos" ? "Todas as categorias" : category}</span>
              <ChevronDown size={16} className={`categoryDropdownChevron${categoryMenuOpen ? " open" : ""}`} />
            </button>
          </div>
        </div>
        <nav className="headerActions" aria-label="Ações">
          <a href="https://www.instagram.com/tulistorebeauty" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
          <a href={`https://api.whatsapp.com/send?phone=${STORE_CONTACTS.whatsappDigits}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsApp size={18} /></a>
          <button className={`headerCartBtn${cartQuantity > 0 ? " hasItems" : ""}${addedModal || cartPulse ? " cartHighlighted" : ""}`} type="button" onClick={handleCartIconClick} aria-label={`Sacola com ${cartQuantity} itens`}><ShoppingBag size={20} className={cartPulse ? "cartPulseAnim" : ""} />{cartQuantity > 0 ? <span className="cartCount">{cartQuantity}</span> : null}</button>
        </nav>
      </header>

      {categoryMenuOpen && createPortal(
        <div
          ref={categoryPanelRef}
          className="categoryDropdownPanel"
          role="listbox"
          aria-label="Categorias"
          style={dropdownStyles}
          data-open={dropdownAnimate}
        >
          <button
            type="button"
            role="option"
            aria-selected={category === "Todos"}
            className={`categoryDropdownOption${category === "Todos" ? " active" : ""}`}
            onClick={(e) => {
              triggerBubble(e);
              setCategory("Todos");
              setTimeout(() => setCategoryMenuOpen(false), 160);
            }}
          >
            <span>Todas as categorias</span>
            {category === "Todos" ? <Check size={16} /> : null}
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={category === item}
              className={`categoryDropdownOption${category === item ? " active" : ""}`}
              onClick={(e) => {
                triggerBubble(e);
                setCategory(item);
                setTimeout(() => setCategoryMenuOpen(false), 160);
              }}
            >
              <span>{item}</span>
              {category === item ? <Check size={16} /> : null}
            </button>
          ))}
        </div>,
        document.body
      )}

      <section className="heroBand" aria-label="Destaques" onMouseEnter={() => setBannerPaused(true)} onMouseLeave={() => setBannerPaused(false)}>
        <div className="heroCarousel" onTouchStart={handleHeroDragStart} onTouchEnd={handleHeroDragEnd}>
          {heroBanners.map((b, i) => (
            <div key={b.id} className={`heroSlide${i === activeBannerIndex ? " active" : ""}`} aria-hidden={i !== activeBannerIndex}>
              <img src={b.imagem} alt="" draggable={false} />
            </div>
          ))}
          {heroBanners.length > 1 ? (
            <>
              <button type="button" className="heroArrow prev" onClick={() => goToBanner(-1)} aria-label="Banner anterior"><ChevronLeft size={22} /></button>
              <button type="button" className="heroArrow next" onClick={() => goToBanner(1)} aria-label="Próximo banner"><ChevronRight size={22} /></button>
            </>
          ) : null}
        </div>
        <div className="heroBadges" aria-label="Destaques"><div><Gift size={20} />Kits</div><div><Truck size={20} />Frete</div><div><Star size={20} />Mimos</div></div>
        {heroBanners.length > 1 ? (<div className="heroDots" role="tablist" aria-label="Selecionar banner">{heroBanners.map((b, i) => (<button key={b.id} className={`heroDot${i === activeBannerIndex ? " active" : ""}`} onClick={() => setActiveBannerIndex(i)} role="tab" aria-selected={i === activeBannerIndex} aria-label={`Banner ${i + 1}`} />))}</div>) : null}
      </section>

      <section className="shopLayout" aria-label="Vitrine e sacola">
        <div className="catalogArea">
          <div className="toolbar" data-reveal><span>{loading ? "Carregando produtos..." : `${filteredProducts.length} produtos`}</span><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} aria-label="Ordenação"><option value="featured">Nome A-Z</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></div>
          <div className="productGrid">
            {loading ? Array.from({ length: 6 }).map((_, i) => (<div className="productCard skeletonCard" key={i} aria-hidden="true"><div className="skeleton skeletonImage" /><div className="productBody"><div className="skeleton skeletonLine" /><div className="skeleton skeletonLine short" /><div className="skeleton skeletonLine" /><div className="skeleton skeletonButton" /></div></div>)) : filteredProducts.map((product, cardIndex) => {
              const sq = cartQty(product.id); const soldOut = product.estoque_qtd <= 0; const canAdd = !soldOut && sq < product.estoque_qtd; const dp = bestUnitPrice(product, payment); const isK = product.categoria === "Kits Presente"; const hp = product.fotos[0] || fallbackImage; const discP = product.preco_desconto ? Math.round((1 - product.preco_desconto / product.preco_normal) * 100) : 0;
              const cardStyle = { "--card-delay": `${(cardIndex % 6) * 0.12}s`, "--float-delay": `${(cardIndex % 5) * 0.6}s` } as React.CSSProperties;
              return (<article className="productCard" key={product.id} data-reveal style={cardStyle} onClick={() => openQuickView(product)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openQuickView(product); } }}>
                <div className="productImage">
                  <img src={hp} alt={product.nome} loading="lazy" decoding="async" width={300} height={300} />
                  {discP > 0 ? <span className="productBadge">-{discP}%</span> : null}
                  {soldOut ? <span className="soldOut">ESGOTADO</span> : null}
                  {sq > 0 ? <span className="cartQtyBadge"><ShoppingBag size={12} /> {sq}</span> : null}
                  {isK && product.fotos.length > 1 ? (<button type="button" className="kitTourBadge" onClick={(e) => { e.stopPropagation(); openKitTour(product); }} aria-label="Ver tour do kit"><Gift size={14} />Ver kit</button>) : null}
                </div>
                <div className="productBody"><div><span className="productCategory">{product.categoria}</span><h2>{product.nome}</h2></div><div className="priceLine"><strong>{formatMoney(dp)}</strong>{product.preco_desconto ? <small>{formatMoney(product.preco_normal)}</small> : null}</div>{product.preco_pix ? <span className="pixPrice">Pix: {formatMoney(product.preco_pix)}</span> : null}<button className={`primaryButton${sq > 0 ? " hasInCart" : ""}`} disabled={!canAdd} onClick={(e) => { e.stopPropagation(); addToCart(product); }}><ShoppingBag size={16} />{soldOut ? "Esgotado" : sq > 0 ? `Adicionar (${sq})` : "Adicionar"}</button></div>
              </article>);
            })}
          </div>
        </div>
        <aside className="cartPanel" aria-label="Sacola">{renderCart(false)}</aside>
      </section>

      <div className={`cartOverlay${cartOpen ? " visible" : ""}`} onClick={() => setCartOpen(false)} />
      <aside
        className={`cartDrawer${cartOpen ? " open" : ""}`}
        aria-label="Sacola móvel"
        style={cartDragOffset ? { transform: `translateY(${cartDragOffset}px)`, transition: "none" } : undefined}
      >
        <button
          type="button"
          className="cartDrawerHandle"
          onClick={() => setCartOpen(false)}
          onTouchStart={handleCartDragStart}
          onTouchMove={handleCartDragMove}
          onTouchEnd={handleCartDragEnd}
          aria-label="Fechar sacola (toque ou arraste para baixo)"
        >
          <span className="drawerHandleBar" />
        </button>
        {renderCart(true)}
      </aside>

      <footer className="storeFooter"><div className="storeFooterContent"><p>{new Date().getFullYear()} Tuli Store Beauty. Cosméticos e acessórios com carinho.</p><nav className="storeFooterLegalNav"><Link href="/politica-de-privacidade">Política de Privacidade</Link><Link href="/politica-de-cookies">Política de Cookies</Link><Link href="/termos-de-uso">Termos de Uso</Link><CookieManageLink /></nav><p><a className="secretAdminLink" href="/admin" aria-label="Acesso administrativo" tabIndex={0}>&middot;</a></p></div></footer>

      {kitTour ? (<div className="kitTourOverlay" role="dialog" aria-modal="true" aria-label={`Tour do kit ${kitTour.product.nome}`} onClick={closeKitTour}><div className="kitTourPanel" onClick={(e) => e.stopPropagation()}><button type="button" className="kitTourClose" onClick={closeKitTour} aria-label="Fechar tour"><X size={20} /></button><div className="kitTourHeader"><Gift size={18} /><div><strong>{kitTour.product.nome}</strong><span>Arraste para explorar as fotos do kit</span></div></div><div className="kitTourStage" onMouseDown={handleKitDragStart} onMouseMove={handleKitDragMove} onMouseUp={handleKitDragEnd} onMouseLeave={handleKitDragEnd} onTouchStart={handleKitDragStart} onTouchMove={handleKitDragMove} onTouchEnd={handleKitDragEnd}><img src={kitTour.product.fotos[kitTour.index] || fallbackImage} alt={`${kitTour.product.nome} - foto ${kitTour.index + 1}`} className="kitTourImage" draggable={false} /><div className="kitTourHint" aria-hidden="true"><ChevronLeft size={16} />Arraste<ChevronRight size={16} /></div></div><div className="kitTourControls"><button type="button" onClick={() => setKitIndex(kitTour.index - 1, kitTour.product.fotos.length)} disabled={kitTour.index <= 0} aria-label="Foto anterior"><ChevronLeft size={18} /></button><div className="kitTourDots">{kitTour.product.fotos.map((_, idx) => (<button key={idx} className={`kitTourDot${idx === kitTour.index ? " active" : ""}`} onClick={() => setKitIndex(idx, kitTour.product.fotos.length)} aria-label={`Foto ${idx + 1}`} />))}</div><button type="button" onClick={() => setKitIndex(kitTour.index + 1, kitTour.product.fotos.length)} disabled={kitTour.index >= kitTour.product.fotos.length - 1} aria-label="Próxima foto"><ChevronRight size={18} /></button></div></div></div>) : null}

      {quickView ? (() => {
        const p = quickView.product; const fotos = p.fotos.length ? p.fotos : [fallbackImage]; const total = fotos.length; const idx = Math.min(quickView.index, total - 1); const img = fotos[idx] || fallbackImage; const soldOut = p.estoque_qtd <= 0; const canAdd = !soldOut && quickView.qtd <= p.estoque_qtd; const dp = bestUnitPrice(p, payment); const isDestaque = Boolean(p.preco_desconto && p.preco_normal > p.preco_desconto); const mA = magnifier?.productId === p.id;
        return (<div className="quickViewOverlay" role="dialog" aria-modal="true" aria-label={`Visão rápida de ${p.nome}`} onClick={handleQuickViewOverlayClick}>
          <div className="quickViewPanel" ref={quickViewPanelRef} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="quickViewClose" onClick={closeQuickView} aria-label="Fechar visão rápida"><X size={20} /></button>
            <div className="quickViewGrid">
              <div className={`quickViewGallery${total > 1 ? "" : " single"}`}>
                {total > 1 ? (
                  <div className="quickViewThumbs" aria-label="Miniaturas do produto">
                    {fotos.map((f, i) => (<button key={i} type="button" className={`quickViewThumb${i === idx ? " active" : ""}`} onClick={() => setQuickViewIndex(i, total)} aria-label={`Foto ${i + 1}`}><img src={f} alt="" /></button>))}
                  </div>
                ) : null}                <div className="quickViewMain">
                  <div className={`quickViewStage${mA ? " magnifying" : ""}`} onMouseMove={(e) => handleMagnifierMove(e, p)} onMouseLeave={handleMagnifierLeave} style={mA ? { backgroundImage: `url(${img})`, backgroundPosition: `${magnifier.x}% ${magnifier.y}%` } : undefined}>
                    <img src={img} alt={`${p.nome} - foto ${idx + 1}`} className={mA ? "hiddenImg" : undefined} draggable={false} />
                    {mA ? <span className="magnifierHint" aria-hidden="true">+</span> : null}
                  </div>
                  {total > 1 ? (
                    <div className="quickViewArrows">
                      <button type="button" onClick={() => setQuickViewIndex(idx - 1, total)} disabled={idx <= 0} aria-label="Foto anterior"><ChevronLeft size={18} /></button>
                      <button type="button" onClick={() => setQuickViewIndex(idx + 1, total)} disabled={idx >= total - 1} aria-label="Próxima foto"><ChevronRight size={18} /></button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="quickViewInfo">
                <div className="quickViewBadges">
                  <span className="quickViewBadge">{p.categoria}</span>
                  {isDestaque ? <span className="quickViewBadge highlight"><Star size={12} /> Destaque</span> : null}
                </div>
                <h2 className="quickViewTitle">{p.nome}</h2>
                <div className="quickViewPrice">
                  <strong>{formatMoney(dp)}</strong>
                  {p.preco_desconto ? <small>{formatMoney(p.preco_normal)}</small> : null}
                  {p.preco_pix ? <span className="pixPrice">Pix: {formatMoney(p.preco_pix)}</span> : null}
                </div>
                {p.descricao ? <p className="quickViewDescription">{p.descricao}</p> : null}
                <div className="quickViewQtyRow">
                  <div className="quantityStepper">
                    <button type="button" onClick={() => setQuickViewQtd(quickView.qtd - 1, p.estoque_qtd)} disabled={quickView.qtd <= 1} aria-label="Diminuir quantidade"><Minus size={16} /></button>
                    <span>{quickView.qtd}</span>
                    <button type="button" onClick={() => setQuickViewQtd(quickView.qtd + 1, p.estoque_qtd)} disabled={quickView.qtd >= p.estoque_qtd} aria-label="Aumentar quantidade"><Plus size={16} /></button>
                  </div>
                </div>
                <button type="button" className="primaryButton quickViewAddBtn" disabled={!canAdd} onClick={() => { addToCart(p, quickView.qtd); closeQuickView(); }}><ShoppingBag size={18} />{soldOut ? "Esgotado" : "Adicionar ao Carrinho"}</button>
                <div className="quickViewActions">
                  <button type="button" className="quickViewAction" onClick={() => handleQuickViewShare(p)} aria-label="Compartilhar"><Share2 size={18} />Compartilhar</button>
                  <button type="button" className="quickViewAction" onClick={() => handleQuickViewWhatsapp(p)} aria-label="Falar no WhatsApp"><WhatsApp size={18} />WhatsApp</button>
                </div>
              </div>
            </div>
          </div>
        </div>);
      })() : null}

      {addedModal ? (
        <div
          className="addedModalOverlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddedModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="addedModalTitle"
        >
          <div className="addedModalCard minimal">
            <div className="addedModalTop">
              <span className="addedModalStatus" id="addedModalTitle">
                <Check size={14} /> Item na sacola
              </span>
              <button
                type="button"
                className="addedModalClose"
                onClick={closeAddedModal}
                aria-label="Fechar notificação"
              >
                <X size={16} />
              </button>
            </div>

            <div className="addedModalProduct minimal">
              <img
                src={addedModal.product.fotos[0] || fallbackImage}
                alt={addedModal.product.nome}
                className="addedModalImage"
              />
              <div className="addedModalDetails">
                <strong>{addedModal.product.nome}</strong>
                <span className="addedModalPrice">
                  {formatMoney(bestUnitPrice(addedModal.product, payment))}
                </span>
              </div>
            </div>

            <div className="addedModalGuideHint">
              <ShoppingBag size={14} className="guideHintBag" />
              <span>Sua sacola fica no <strong>topo da loja, à direita</strong></span>
              <span className="guideHintArrow" aria-hidden="true">↗</span>
            </div>

            <button
              type="button"
              className="addedModalPrimaryBtn minimal"
              onClick={handleViewCartFromModal}
            >
              <ShoppingBag size={16} />
              <span>Ver Sacola ({cartQuantity})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="toastContainer" aria-live="polite" aria-atomic="false">{toasts.map((t) => (<div key={t.id} className={`toast toast-${t.kind}`}><span className="toastIcon">{t.kind === "success" ? <CheckCircle2 size={20} /> : t.kind === "error" ? <X size={20} /> : <Heart size={18} />}</span><div className="toastContent"><strong>{t.title}</strong>{t.message ? <span>{t.message}</span> : null}</div><button type="button" className="toastClose" onClick={() => dismissToast(t.id)} aria-label="Fechar notificação"><X size={16} /></button></div>))}</div>
    </main>
  );
}