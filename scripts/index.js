import { MARKETS } from "./markets.js";

document.addEventListener("DOMContentLoaded", () => {
  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const detectByNavigator = () => {
    const navLang = (navigator.language || "pt-BR").toUpperCase();
    const langParts = navLang.split("-");
    const primaryLang = langParts[0];
    const region = langParts[1] || "";

    const supported = ["BR", "CO", "CL", "UY", "MX"];

    if (region && supported.includes(region)) {
      return region;
    }

    if (primaryLang === "PT") {
      return "BR";
    }
    if (primaryLang === "ES") {
      return "MX";
    }

    console.log(region);

    return null;
  };

  const detectMarket = () => {
    const qp = (getQueryParam("country") || "").toUpperCase();
    if (MARKETS[qp]) return qp;
    const byNav = detectByNavigator();
    if (MARKETS[byNav]) return byNav;
    return "BR";
  };

  const MARKET_CODE = detectMarket();
  const MARKET = MARKETS[MARKET_CODE];

  document.documentElement.lang = MARKET.locale;

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
  const priceTitle = document.getElementById("price-title");
  const resaleLabel = document.querySelector('label[for="resale"]');
  const resaleTitle = document.getElementById("resale-title");
  const discountLabel = document.getElementById("discount-label");
  const discountTitle = document.getElementById("discount-title");
  const marginTitle = document.getElementById("margin-title");
  const finalPriceLabel = document.getElementById("final-price-label");
  const finalPriceTitle = document.getElementById("final-price-title");
  const profitLabel = document.querySelector(".profit .label-group label");
  const howToBtn = document.querySelector("button");
  const customOptionsFidelity = document.querySelector(
    '.custom-options li[data-value="fidelity"]'
  );
  const customOptionsSecond = document.querySelector(
    '.custom-options li[data-value="second-unit"]'
  );

  let currencyFormatter = new Intl.NumberFormat(MARKET.locale, {
    style: "currency",
    currency: MARKET.currency,
  });
  const currencyOptions = currencyFormatter.resolvedOptions();
  const fractionDigits = currencyOptions.maximumFractionDigits;
  const SCALE = Math.pow(10, fractionDigits);

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
    const parts = new Intl.NumberFormat(MARKET.locale, {
      style: "currency",
      currency: MARKET.currency,
    }).formatToParts(value);

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
  };

  const updateUIForMode = (mode) => {
    const t = MARKET.texts;
    if (mode === "fidelity") {
      priceLabel.textContent = t.priceLabel;
      priceTitle.setAttribute("title", t.priceTitle);
      resaleLabel.textContent = t.resaleLabel;
      resaleTitle.setAttribute("title", t.resaleTitle);
      discountLabel.textContent = t.discountLabel;
      discountTitle.setAttribute("title", t.discountTitle);
      profitLabel.textContent = t.marginLabel;
      marginTitle.setAttribute("title", t.marginTitle);
      finalPriceLabel.textContent = t.finalPriceLabel;
      finalPriceTitle.setAttribute("title", t.finalPriceTitle);
    } else if (mode === "second-unit") {
      priceLabel.textContent = t.priceLabelSecondUnit;
      priceTitle.setAttribute("title", t.priceTitleSecondUnit);
      resaleLabel.textContent = t.resaleLabelSecondUnit;
      resaleTitle.setAttribute("title", t.resaleTitleSecondUnit);
      discountLabel.textContent = t.discountLabelSecondUnit;
      discountTitle.setAttribute("title", t.discountTitleSecondUnit);
      profitLabel.textContent = t.marginLabelSecondUnit;
      marginTitle.setAttribute("title", t.marginTitleSecondUnit);
      finalPriceLabel.textContent = t.finalPriceLabelSecondUnit;
      finalPriceTitle.setAttribute("title", t.finalPriceTitleSecondUnit);
    }
  };

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

    if (discountPercentage > 0) {
      discountPercentageText.textContent = MARKET.texts.discountWith(
        Math.round(discountPercentage)
      );
    } else {
      discountPercentageText.textContent = MARKET.texts.discountPlaceholder;
    }
  };

  const handleInput = (inputElement) => {
    formatAsCurrency(inputElement);
    calculateAndupdateUI();
  };

  applyTranslations();
  updateUIForMode(selectType.value);
  calculateAndupdateUI();

  priceInput.addEventListener("input", () => handleInput(priceInput));
  resaleInput.addEventListener("input", () => handleInput(resaleInput));
  discountInput.addEventListener("input", () => handleInput(discountInput));
  selectType.addEventListener("change", () => {
    updateUIForMode(selectType.value);
    calculateAndupdateUI();
  });

  const wrapper = document.querySelector(".custom-select-wrapper");
  const trigger = document.querySelector(".custom-select-trigger");
  const selectedOptionDisplay = document.querySelector(".selected-option");
  const customOptions = document.querySelectorAll(".custom-options li");

  function setupInitialSelection() {
    const initialValue = selectType.value;
    const initialOption = document.querySelector(
      `.custom-options li[data-value="${initialValue}"]`
    );
    if (initialOption) {
      selectedOptionDisplay.innerHTML = initialOption.innerHTML;
    }
  }

  trigger.addEventListener("click", () => {
    wrapper.classList.toggle("open");
  });

  customOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectedOptionDisplay.innerHTML = option.innerHTML;
      selectType.value = option.getAttribute("data-value");
      selectType.dispatchEvent(new Event("change"));
      wrapper.classList.remove("open");
    });
  });

  window.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove("open");
    }
  });

  setupInitialSelection();
});
