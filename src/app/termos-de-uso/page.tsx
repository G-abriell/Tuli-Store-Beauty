import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";
import { LEGAL_DATA } from "@/lib/legal-data";

export const metadata: Metadata = {
  title: "Termos de Uso — Tuli Store Beauty",
  description: "Termos e condições de uso do site e de venda de produtos da Tuli Store Beauty.",
  robots: { index: true, follow: true },
};

export default function TermosDeUsoPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="Condições de uso do site e de compra dos produtos da Tuli Store Beauty."
    >
      <p>
        Estes Termos de Uso ("Termos") regulam o acesso e a utilização do site{" "}
        <strong>{LEGAL_DATA.SITE_URL}</strong> ("Site") pela pessoa que nele navega ("Você",
        "Cliente"), bem como as condições de venda dos produtos oferecidos pela{" "}
        <strong>{LEGAL_DATA.CONTROLADOR_NOME}</strong> ("Loja", "nós").
      </p>
      <p>
        Ao navegar no Site ou finalizar um pedido, você concorda integralmente com estes Termos.
        Caso não concorde, por favor não utilize o Site.
      </p>

      <h2>1. Sobre a loja</h2>
      <ul>
        <li><strong>Nome:</strong> {LEGAL_DATA.CONTROLADOR_NOME_FANTASIA}</li>
        <li><strong>Contato:</strong> <a href={`mailto:${LEGAL_DATA.CONTROLADOR_EMAIL}`}>{LEGAL_DATA.CONTROLADOR_EMAIL}</a> · WhatsApp <a href="https://wa.me/5581983143861" target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_WHATSAPP}</a></li>
        <li><strong>Instagram:</strong> <a href={LEGAL_DATA.CONTROLADOR_INSTAGRAM_URL} target="_blank" rel="noreferrer">{LEGAL_DATA.CONTROLADOR_INSTAGRAM}</a></li>
      </ul>

      <h2>2. Natureza do site</h2>
      <p>
        O Site é uma vitrine online de cosméticos e acessórios. A finalização do pedido ocorre da
        seguinte forma: você escolhe os produtos no Site, preenche seus dados (nome, e-mail,
        WhatsApp, forma de entrega e pagamento) e o Site gera uma mensagem pré-preenchida que é
        enviada para o WhatsApp da Loja. <strong>A confirmação do pedido é feita manualmente pela
        Loja, via WhatsApp</strong>, e pode ser recusada caso o produto esteja esgotado, o
        pagamento não seja confirmado ou por qualquer motivo relevante.
      </p>

      <h2>3. Cadastro e dados</h2>
      <p>
        Você não precisa criar conta para comprar. Apenas os dados informados no checkout (nome,
        e-mail, WhatsApp) serão coletados. Consulte nossa{" "}
        <a href="/politica-de-privacidade">Política de Privacidade</a> para entender como
        tratamos esses dados.
      </p>

      <h2>4. Produtos e preços</h2>
      <ul>
        <li>Os produtos exibidos no Site estão sujeitos a disponibilidade de estoque;</li>
        <li>Os preços são exibidos em Reais (R$) e podem sofrer alteração a qualquer momento, sem aviso prévio;</li>
        <li>Os preços promocionais (quando houver) são válidos enquanto durarem os estoques;</li>
        <li>As imagens dos produtos são meramente ilustrativas;</li>
        <li>O valor final do pedido é o exibido no momento da finalização.</li>
      </ul>

      <h2>5. Formas de pagamento</h2>
      <p>Atualmente a Loja aceita as seguintes formas de pagamento:</p>
      <ul>
        <li><strong>Pix</strong> — com desconto, quando aplicável;</li>
        <li><strong>Cartão de débito ou crédito</strong> — processado presencialmente na entrega ou retirada;</li>
        <li><strong>Dinheiro</strong> — na entrega ou retirada.</li>
      </ul>
      <p>
        O Site não processa pagamentos online. As instruções de pagamento são enviadas pela
        Loja após a confirmação do pedido via WhatsApp.
      </p>

      <h2>6. Formas de entrega</h2>
      <ul>
        <li><strong>Retirada na loja</strong> — combinada após o pedido;</li>
        <li><strong>Retirada no ICB / UPE</strong> — combinada após o pedido;</li>
        <li><strong>Entrega via app (99 Pop / Uber Flash)</strong> — frete pago pelo cliente, a combinar.</li>
      </ul>

      <h2>7. Confirmação do pedido</h2>
      <p>
        Ao finalizar o pedido no Site, você será redirecionado para o WhatsApp com uma mensagem
        pré-preenchida. A Loja confirmará o pedido, a disponibilidade dos itens e os detalhes de
        pagamento e entrega. <strong>O pedido só se considera confirmado após o aceite da Loja
        via WhatsApp</strong>.
      </p>

      <h2>8. Cancelamento e devolução</h2>
      <ul>
        <li>Você pode cancelar o pedido a qualquer momento antes da confirmação pela Loja, sem custo;</li>
        <li>Após a confirmação, o cancelamento será analisado caso a caso;</li>
        <li>Trocas e devoluções seguem o Código de Defesa do Consumidor (Lei 8.078/90). Em caso de produto com defeito, entre em contato em até 7 dias corridos contados do recebimento;</li>
        <li>Produtos de higiene pessoal e cosméticos não podem ser devolvidos após abertura, salvo defeito de fabricação.</li>
      </ul>

      <h2>9. Direito de arrependimento</h2>
      <p>
        Conforme o art. 49 do CDC, você tem <strong>7 dias corridos</strong> para desistir da
        compra realizada fora do estabelecimento comercial (online), contados a partir do
        recebimento do produto. Nesse caso, o valor pago será devolvido no mesmo meio utilizado
        para o pagamento.
      </p>

      <h2>10. Propriedade intelectual</h2>
      <p>
        Todos os elementos do Site (logos, textos, imagens, layout, código) são de propriedade da
        Loja ou de terceiros que autorizaram seu uso. É proibida a reprodução total ou parcial
        sem autorização prévia e expressa.
      </p>

      <h2>11. Condutas proibidas</h2>
      <p>
        Ao usar o Site, você concorda em não:
      </p>
      <ul>
        <li>Utilizar bots, scripts ou qualquer meio automatizado para fazer pedidos;</li>
        <li>Tentar acessar áreas restritas (como o painel administrativo) sem autorização;</li>
        <li>Coletar dados de outros clientes;</li>
        <li>Realizar pedidos falsos, com dados inválidos ou com intuito fraudulento;</li>
        <li>Utilizar o Site para qualquer finalidade ilegal ou abusiva.</li>
      </ul>
      <p>
        O Site utiliza captcha e rate limiting para prevenir abusos. Pedidos suspeitos podem ser
        recusados sem aviso prévio.
      </p>

      <h2>12. Limitação de responsabilidade</h2>
      <p>
        A Loja não se responsabiliza por:
      </p>
      <ul>
        <li>Indisponibilidade temporária do Site por manutenção ou falhas técnicas;</li>
        <li>Erros de digitação do cliente no momento do pedido (ex.: endereço ou WhatsApp errado);</li>
        <li>Atrasos em entregas realizadas por aplicativos de terceiros (99 Pop, Uber Flash);</li>
        <li>Variações de cor em fotos dos produtos devido ao monitor ou iluminação do cliente.</li>
      </ul>

      <h2>13. Foro e legislação aplicável</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
        da comarca do domicílio da Loja para dirimir qualquer controvérsia decorrente destes
        Termos, com renúncia a qualquer outro, por mais privilegiado que seja.
      </p>

      <h2>14. Alterações dos Termos</h2>
      <p>
        A Loja reserva-se o direito de alterar estes Termos a qualquer momento. A versão em vigor
        está sempre disponível nesta página, com a data de última atualização indicada no topo.
        Recomendamos revisar periodicamente.
      </p>
    </LegalLayout>
  );
}
