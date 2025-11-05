import { MARKETS } from "./markets.js";

// --- FUNÇÃO DE DETECÇÃO POR IP (sem alterações) ---
const detectMarketByIP = async () => {
  try {
    const response = await fetch("http://ip-api.com/json/?fields=countryCode");
    if (!response.ok) return null;
    const data = await response.json();
    const countryCode = data.countryCode;
    const supported = ["BR", "CO", "CL", "UY", "MX"];
    return supported.includes(countryCode) ? countryCode : null;
  } catch (error) {
    console.error("Erro ao detectar país por IP:", error);
    return null;
  }
};

// --- EVENTO PRINCIPAL ---
document.addEventListener("DOMContentLoaded", async () => {
  // --- OBTENÇÃO DOS ELEMENTOS DO DOM (movido para o escopo principal) ---
  const logoImg = document.getElementById("site-logo");
  const priceInput = document.getElementById("price");
  const resaleInput = document.getElementById("resale");
  const discountInput = document.getElementById("discount");
  const profitMarginText = document.getElementById("profit-margin-text");
  const finalPriceValue = document.getElementById("final-price-value");
  const discountPercentageText = document.getElementById(
    "discount-percentage-text"
  );
  const titleEl = document.querySelector("main h1");
  const selectType = document.getElementById("descont-type");
  const priceLabel = document.getElementById("price-label");
  const priceTooltip = document.getElementById("price-tooltip");
  const resaleLabel = document.querySelector('label[for="resale"]');
  const resaleTooltip = document.getElementById("resale-tooltip");
  const discountLabel = document.getElementById("discount-label");
  const discountTooltip = document.getElementById("discount-tooltip");
  const marginTooltip = document.getElementById("margin-tooltip");
  const finalPriceLabel = document.getElementById("final-price-label");
  const finalPriceTooltip = document.getElementById("final-price-tooltip");
  const profitLabel = document.querySelector(".profit .label-group label");
  const howToBtn = document.getElementById("how-to-use-btn");
  const customOptionsFidelity = document.querySelector(
    '.custom-options li[data-value="fidelity"]'
  );
  const customOptionsSecond = document.querySelector(
    '.custom-options li[data-value="second-unit"]'
  );
  const currentFlag = document.getElementById("current-flag");
  const priceTrigger = document.getElementById("price-trigger");
  const resaleTrigger = document.getElementById("resale-trigger");
  const discountTrigger = document.getElementById("discount-trigger");
  const marginTrigger = document.getElementById("margin-trigger");
  const finalPriceTrigger = document.getElementById("final-price-trigger");

  // --- VARIÁVEIS DE ESTADO (declaradas com 'let' para serem modificadas) ---
  let MARKET;
  let currencyFormatter;
  let SCALE;

  // =========================================================================
  //      MUDANÇA PRINCIPAL: FUNÇÃO CENTRAL DE ATUALIZAÇÃO
  // =========================================================================
  const updateAppForMarket = (marketCode) => {
    MARKET = MARKETS[marketCode];
    if (!MARKET) return; // Segurança caso o marketCode seja inválido

    // 1. Atualizar Logo e Bandeira
    document.documentElement.lang = MARKET.locale;
    logoImg.src = MARKET.logo;
    logoImg.alt = `Logo ${
      marketCode === "BR" ? "Mercado Livre" : "Mercado Libre"
    }`;
    currentFlag.src = `assets/flags/${marketCode.toLowerCase()}.svg`;

    // 2. Re-criar o formatador de moeda
    currencyFormatter = new Intl.NumberFormat(MARKET.locale, {
      style: "currency",
      currency: MARKET.currency,
    });
    const currencyOptions = currencyFormatter.resolvedOptions();
    const fractionDigits = currencyOptions.maximumFractionDigits;
    SCALE = Math.pow(10, fractionDigits);

    // 3. Limpar e reformatar os inputs existentes
    priceInput.value = "";
    resaleInput.value = "";
    discountInput.value = "";

    // 4. Chamar TODAS as funções de atualização com os novos dados
    applyTranslations();
    updateUIForMode(selectType.value);
    calculateAndupdateUI(); // Isso também atualiza o seletor de tipo
  };

  // --- FUNÇÕES AUXILIARES (agora elas usam as variáveis de estado 'MARKET' e 'currencyFormatter') ---

  const formatAsCurrency = (input) => {
    let digits = input.value.replace(/\D/g, "");
    if (digits === "") {
      input.value = "";
      return;
    }
    let numeric = parseInt(digits, 10) / SCALE;
    input.value = currencyFormatter.format(numeric);
  };

  const parseCurrency = (formatted) => {
    if (!formatted) return 0;
    const digits = formatted.replace(/\D/g, "");
    if (digits === "") return 0;
    return parseInt(digits, 10) / SCALE;
  };

  const formatCurrencyToHTML = (value) => {
    const parts = currencyFormatter.formatToParts(value);
    return parts
      .map((part) => {
        switch (part.type) {
          case "fraction":
            return `<span>${part.value}</span>`;
          case "group":
          case "decimal":
            return "";
          default:
            return part.value;
        }
      })
      .join("");
  };

  const applyTranslations = () => {
    const t = MARKET.texts;
    if (titleEl) titleEl.textContent = t.title;

    const fidelityNode =
      customOptionsFidelity.childNodes[
        customOptionsFidelity.childNodes.length - 1
      ];
    const secondUnitNode =
      customOptionsSecond.childNodes[customOptionsSecond.childNodes.length - 1];
    if (fidelityNode) fidelityNode.nodeValue = ` ${t.discountTypeFidelity}`;
    if (secondUnitNode)
      secondUnitNode.nodeValue = ` ${t.discountTypeSecondUnit}`;

    if (howToBtn) howToBtn.textContent = t.howToUse;
    const ph = currencyFormatter.format(0);
    if (priceInput) priceInput.placeholder = ph;
    if (resaleInput) resaleInput.placeholder = ph;
    if (discountInput) discountInput.placeholder = ph;

    // Atualiza também o texto do seletor personalizado
    const selectedOptionDisplay = document.querySelector(".selected-option");
    const currentMode = selectType.value;
    const currentCustomOption = document.querySelector(
      `.custom-options li[data-value="${currentMode}"]`
    );
    if (selectedOptionDisplay && currentCustomOption) {
      selectedOptionDisplay.innerHTML = currentCustomOption.innerHTML;
    }
  };

  const updateUIForMode = (mode) => {
    const t = MARKET.texts;
    const labels =
      mode === "fidelity"
        ? {
            pL: t.priceLabel,
            pT: t.priceTitle, // O texto continua vindo do market.js
            rL: t.resaleLabel,
            rT: t.resaleTitle,
            dL: t.discountLabel,
            dT: t.discountTitle,
            mL: t.marginLabel,
            mT: t.marginTitle,
            fpL: t.finalPriceLabel,
            fpT: t.finalPriceTitle,
          }
        : {
            pL: t.priceLabelSecondUnit,
            pT: t.priceTitleSecondUnit,
            rL: t.resaleLabelSecondUnit,
            rT: t.resaleTitleSecondUnit,
            dL: t.discountLabelSecondUnit,
            dT: t.discountTitleSecondUnit,
            mL: t.marginLabelSecondUnit,
            mT: t.marginTitleSecondUnit,
            fpL: t.finalPriceLabelSecondUnit,
            fpT: t.finalPriceTitleSecondUnit,
          };

    priceLabel.textContent = labels.pL;
    // MUDANÇA AQUI: De 'setAttribute("title", ...)' para '.textContent'
    priceTooltip.textContent = labels.pT;

    resaleLabel.textContent = labels.rL;
    resaleTooltip.textContent = labels.rT; // MUDANÇA

    discountLabel.textContent = labels.dL;
    discountTooltip.textContent = labels.dT; // MUDANÇA

    profitLabel.textContent = labels.mL;
    marginTooltip.textContent = labels.mT; // MUDANÇA

    finalPriceLabel.textContent = labels.fpL;
    finalPriceTooltip.textContent = labels.fpT; // MUDANÇA
  };

  const allTriggers = [
    priceTrigger,
    resaleTrigger,
    discountTrigger,
    marginTrigger,
    finalPriceTrigger,
  ];
  const allTooltips = [
    priceTooltip,
    resaleTooltip,
    discountTooltip,
    marginTooltip,
    finalPriceTooltip,
  ];

  // Função para fechar todos os tooltips
  const closeAllTooltips = () => {
    allTooltips.forEach((tooltip) => tooltip.classList.remove("show"));
  };

  // Adiciona listener de clique para cada ícone (trigger)
  allTriggers.forEach((trigger) => {
    if (trigger) {
      const tooltipId = trigger.getAttribute("aria-describedby");
      const tooltip = document.getElementById(tooltipId);

      if (tooltip) {
        trigger.addEventListener("click", (e) => {
          e.stopPropagation(); // Impede que o clique chegue ao 'window'

          // Verifica se o tooltip clicado já estava aberto
          const wasOpen = tooltip.classList.contains("show");

          // Fecha todos os tooltips abertos
          closeAllTooltips();

          // Se o tooltip clicado não estava aberto, ele o abre.
          // Se estava, o passo anterior já o fechou (toggle)
          if (!wasOpen) {
            tooltip.classList.add("show");
          }
        });
      }
    }
  });

  // Adiciona listener "clique fora" para fechar
  window.addEventListener("click", () => {
    closeAllTooltips();
  });

  const calculateAndupdateUI = () => {
    const mode = selectType.value;
    const grossValue = parseCurrency(priceInput.value);
    const resaleValue = parseCurrency(resaleInput.value);
    const discountValue = parseCurrency(discountInput.value);

    let finalPrice = 0;
    let discountPercentage = 0;
    let marginText = "--";
    let marginClass = "";

    if (mode === "fidelity") {
      finalPrice = resaleValue - discountValue;
      if (resaleValue > 0) {
        discountPercentage = (discountValue / resaleValue) * 100;
      }
      if (grossValue > 0) {
        const profit = finalPrice - grossValue;
        const markupPercentage = (profit / grossValue) * 100;
        if (markupPercentage > 40) {
          marginText = MARKET.texts.marginHigh;
          marginClass = "profit-high";
        } else if (markupPercentage >= 20) {
          marginText = MARKET.texts.marginMedium;
          marginClass = "profit-medium";
        } else {
          marginText = MARKET.texts.marginLow;
          marginClass = "profit-low";
        }
      }
    } else if (mode === "second-unit") {
      const totalCost = grossValue * 2;
      const totalRevenue = resaleValue * 2 - discountValue;
      finalPrice = totalRevenue;
      if (resaleValue > 0) {
        discountPercentage = (discountValue / (resaleValue * 2)) * 100;
      }
      if (totalCost > 0) {
        const profit = totalRevenue - totalCost;
        const markupPercentage = (profit / totalCost) * 100;
        if (markupPercentage > 40) {
          marginText = MARKET.texts.marginHigh;
          marginClass = "profit-high";
        } else if (markupPercentage >= 20) {
          marginText = MARKET.texts.marginMedium;
          marginClass = "profit-medium";
        } else {
          marginText = MARKET.texts.marginLow;
          marginClass = "profit-low";
        }
      }
    }

    if (finalPrice < 0) finalPrice = 0;

    profitMarginText.textContent = marginText;
    profitMarginText.className = marginClass;
    finalPriceValue.innerHTML = formatCurrencyToHTML(finalPrice);
    discountPercentageText.textContent =
      discountPercentage > 0
        ? MARKET.texts.discountWith(Math.round(discountPercentage))
        : MARKET.texts.discountPlaceholder;
  };

  const handleInput = (inputElement) => {
    formatAsCurrency(inputElement);
    calculateAndupdateUI();
  };

  // --- INICIALIZAÇÃO E EVENT LISTENERS ---

  // Lógica de detecção inicial (simplificada)
  const getQueryParam = (name) =>
    new URLSearchParams(window.location.search).get(name);
  const initialMarketCode = (
    getQueryParam("country") ||
    (await detectMarketByIP()) ||
    "BR"
  ).toUpperCase();

  // Primeira chamada da função central
  updateAppForMarket(initialMarketCode);

  // Listeners para os inputs e selects
  priceInput.addEventListener("input", () => handleInput(priceInput));
  resaleInput.addEventListener("input", () => handleInput(resaleInput));
  discountInput.addEventListener("input", () => handleInput(discountInput));
  selectType.addEventListener("change", () => {
    updateUIForMode(selectType.value);
    calculateAndupdateUI();
  });

  // Listener para o seletor de país (simplificado para chamar a função central)
  const marketSelector = document.querySelector(".market-selector");
  marketSelector.addEventListener("click", (e) => {
    const option = e.target.closest(".market-options li");
    if (option) {
      const newCountry = option.dataset.country;
      updateAppForMarket(newCountry); // <-- A MÁGICA ACONTECE AQUI
      marketSelector.classList.remove("open");
    } else if (e.target.closest(".market-selected")) {
      marketSelector.classList.toggle("open");
    }
  });

  // Fechar o seletor ao clicar fora
  window.addEventListener("click", (e) => {
    if (!marketSelector.contains(e.target)) {
      marketSelector.classList.remove("open");
    }
  });

  // Lógica do seletor de tipo de desconto (sem alterações, mas inserida na ordem correta)
  const wrapper = document.querySelector(".custom-select-wrapper");
  const trigger = document.querySelector(".custom-select-trigger");
  const selectedOptionDisplay = document.querySelector(".selected-option");
  const customOptions = document.querySelectorAll(".custom-options li");

  trigger.addEventListener("click", () => wrapper.classList.toggle("open"));
  customOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedOptionDisplay.innerHTML = option.innerHTML;
      selectType.value = option.getAttribute("data-value");
      selectType.dispatchEvent(new Event("change"));
      wrapper.classList.remove("open");
    });
  });
});
