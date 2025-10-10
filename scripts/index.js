document.addEventListener("DOMContentLoaded", () => {
  const discountTypeSelect = document.getElementById("descont-type");
  const priceInput = document.getElementById("price");
  const discountInput = document.getElementById("discount");

  const priceLabel = document.getElementById("price-label");
  const discountLabel = document.getElementById("discount-label");
  const finalPriceLabel = document.getElementById("final-price-label");

  const profitMarginText = document.getElementById("profit-margin-text");
  const finalPriceValue = document.getElementById("final-price-value");
  const discountPercentageText = document.getElementById(
    "discount-percentage-text"
  );

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const formatAsCurrency = (input) => {
    let value = input.value.replace(/\D/g, "");
    if (value === "") {
      input.value = "";
      return;
    }
    const numericValue = parseFloat(value) / 100;
    input.value = currencyFormatter.format(numericValue);
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    const cleanedValue = formattedValue.replace(/[^\d,]/g, "");
    const floatValue = cleanedValue.replace(",", ".");
    return parseFloat(floatValue) || 0;
  };

  const updateLabels = () => {
    const selectedMode = discountTypeSelect.value;

    if (selectedMode === "fidelity") {
      priceLabel.textContent = "Valor Bruto";
      discountLabel.textContent = "Desconto";
      finalPriceLabel.textContent = "Preço Final";
    } else if (selectedMode === "second-unit") {
      priceLabel.textContent = "Valor da Unidade";
      discountLabel.textContent = "Desconto na 2ª Unidade";
      finalPriceLabel.textContent = "Preço Final (2 unidades)";
    }
  };

  const calculateAndupdateUI = () => {
    const selectedMode = discountTypeSelect.value;
    const value1 = parseCurrency(priceInput.value);
    const value2 = parseCurrency(discountInput.value);

    let totalGrossValue, totalDiscount, totalFinalPrice;

    if (selectedMode === "fidelity") {
      totalGrossValue = value1;
      totalDiscount = value2;
      totalFinalPrice = totalGrossValue - totalDiscount;
    } else if (selectedMode === "second-unit") {
      const unitPrice = value1;
      const secondUnitDiscount = value2;

      totalGrossValue = unitPrice * 2;
      totalDiscount = secondUnitDiscount;
      totalFinalPrice = totalGrossValue - totalDiscount;
    }

    let discountPercentage = 0;
    if (totalGrossValue > 0) {
      discountPercentage = (totalDiscount / totalGrossValue) * 100;
    }

    if (totalFinalPrice < 0) {
      totalFinalPrice = 0;
    }

    let remainingPercentage = 0;
    if (totalGrossValue > 0) {
      remainingPercentage = (totalFinalPrice / totalGrossValue) * 100;
    }

    let marginText = "--";
    let marginClass = "";
    if (totalGrossValue > 0) {
      if (remainingPercentage > 40) {
        marginText = "ALTA";
        marginClass = "profit-high";
      } else if (remainingPercentage >= 20) {
        marginText = "MÉDIA";
        marginClass = "profit-medium";
      } else {
        marginText = "BAIXA";
        marginClass = "profit-low";
      }
    }

    profitMarginText.textContent = marginText;
    profitMarginText.className = marginClass;

    const finalPriceString = totalFinalPrice.toFixed(2).replace(".", ",");
    const [integerPart, centsPart] = finalPriceString.split(",");
    finalPriceValue.innerHTML = `R$ ${integerPart}<span>${
      centsPart || "00"
    }</span>`;

    if (discountPercentage > 0) {
      discountPercentageText.textContent = `Com ${discountPercentage.toFixed(
        0
      )}% de desconto`;
    } else {
      discountPercentageText.textContent = "";
    }
  };

  const handleInput = (inputElement) => {
    formatAsCurrency(inputElement);
    calculateAndupdateUI();
  };

  priceInput.addEventListener("input", () => handleInput(priceInput));
  discountInput.addEventListener("input", () => handleInput(discountInput));

  discountTypeSelect.addEventListener("change", () => {
    updateLabels();
    calculateAndupdateUI();
  });

  updateLabels();
  calculateAndupdateUI();
});
