export const manifest = {
  merchant: {
    id: '800',
    tenantId: 'accesso',
    name: 'Merchant Name',
    theme: {
      primaryColor: '#15803d',
      // primaryColor: 'blue',
      secondaryColor: '#66BB6A',
      fontFamily: 'Roboto',
      borderRadius: '8px',
      applyLayoutColor: 'false',
    },
  },
  applicationConfigs: [],
  navigation: {
    pages: [
      {
        id: 'insurance',
        route: '/insurance',
        order: 1,
        title: 'Insurance',
        enabled: true,
        icon: 'shield-check',
        components: [
          {
            id: 'comp_donation_001',
            componentType: 'donation',
            order: 1,
            enabled: true,
            features: {
              amounts: [1, 2, 5],
              roundingMultiple: 0,
              enableRounding: false,
              enableCustomAmount: true,
              splitDonation: false,
            },
            localeRefs: {
              namespace: 'donation',
              keys: ['title', 'amount', 'custom'],
            },
            styleOverrides: {
              borderRadius: '4px',
              // primaryColor: '#112A46',
              backgroundColor: '#dcfce7',
              // backgroundColor: 'red',
            },
          },

          // call pay auth
          // listen for restilt
          // make patch request

          // no more generate amanzon pay

          {
            id: 'comp_insurance_001',
            componentType: 'insurance',
            order: 2,
            enabled: true,
            features: {
              apiKey: 'pk_sandbox_a6cad69eeb720ce5bcf0e0c1e4c0d32f0e608590',
              splitInsurance: false,
            },
            localeRefs: {
              namespace: 'insurance',
              keys: ['title'],
            },
            styleOverrides: {
              borderRadius: '4px',
              primaryColor: '#112A46',
              backgroundColor: 'red',
              // backgroundColor: '#eef1ff',
            },
          },
        ],
      },
      {
        id: 'pay-monthly',
        route: '/pay-monthly',
        order: 1,
        title: 'Pay Monthly',
        enabled: true,
        icon: 'shield-check',
        components: [
          {
            id: 'comp_flexpay',
            componentType: 'pay-later',
            order: 1,
            enabled: true,
            features: {
              apiKey: 'pk_sandbox_flexpay',
            },
            localeRefs: {
              namespace: 'flexpay',
              keys: ['title', 'button', 'custom'],
            },
          },
          // {
          //   id: 'comp_insurance_001',
          //   componentType: 'insurance',
          //   order: 2,
          //   enabled: false,
          //   features: {
          //     apiKey: 'pk_sandbox_a6cad69eeb720ce5bcf0e0c1e4c0d32f0e608590',
          //     splitInsurance: false,
          //   },
          //   localeRefs: {
          //     namespace: 'insurance',
          //     keys: ['title'],
          //   },
          //   styleOverrides: {
          //     borderRadius: '4px',
          //     primaryColor: '#112A46',
          //     backgroundColor: '#eef1ff',
          //   },
          // },
        ],
      },
      {
        id: 'payment',
        route: '/payment',
        order: 2,
        title: 'Payment',
        enabled: true,
        icon: 'credit-card',
        components: [
          // {
          //   id: 'comp_insurance_001',
          //   componentType: 'insurance',
          //   order: 1,
          //   enabled: true,
          //   features: {
          //     apiKey: 'pk_sandbox_a6cad69eeb720ce5bcf0e0c1e4c0d32f0e608590',
          //     splitInsurance: false,
          //   },
          //   localeRefs: {
          //     namespace: 'insurance',
          //     keys: ['title'],
          //   },
          //   styleOverrides: {
          //     borderRadius: '4px',
          //     primaryColor: '#112A46',
          //     backgroundColor: '#eef1ff',
          //   },
          // },
          {
            id: 'comp_payment_001',
            componentType: 'payment-method-selector',
            order: 3,
            enabled: true,
            features: {
              hideHeader: true,
              skipPaymentSelection: false,
              fullDemographicMethods: null,
            },
            localeRefs: {
              namespace: 'billing',
              keys: ['giftcard', 'applepay', 'voucher'],
            },
          },
          // {
          //   id: 'comp_donation_001',
          //   componentType: 'donation',
          //   order: 2,
          //   enabled: true,
          //   features: {
          //     amounts: [1, 2, 5],
          //     roundingMultiple: 0,
          //     enableRounding: false,
          //     enableCustomAmount: true,
          //     splitDonation: false,
          //   },
          //   localeRefs: {
          //     namespace: 'donation',
          //     keys: ['title', 'amount', 'custom'],
          //   },
          //   styleOverrides: {
          //     primaryColor: '#112A46',
          //     backgroundColor: '#eef1ff',
          //   },
          // },
        ],
      },
    ],
    currentPageIndex: 0,
    allowSkip: false,
    showProgress: true,
  },
  integrations: [
    {
      id: 'int_cybersource_001',
      type: 'payment',
      provider: 'Cybersource',
      enabled: true,
      initStrategy: {
        timing: 'critical',
        blocksRendering: true,
        requiredForPages: ['checkout'],
      },
      credentials: {
        merchantId: '3',
      },
      settings: {
        paymentMethods: {
          CCD: [
            {
              cardBrand: 'VISA',
              cardBrandCode: 'VIS',
              enabled3ds: true,
              displayOrder: 1,
            },
            {
              cardBrand: 'MASTERCARD',
              cardBrandCode: 'MAS',
              enabled3ds: false,
              displayOrder: 2,
            },
            {
              cardBrand: 'AMERICAN EXPRESS',
              cardBrandCode: 'AME',
              enabled3ds: false,
              displayOrder: 3,
            },
            {
              cardBrand: 'DISCOVER',
              cardBrandCode: 'DIS',
              enabled3ds: false,
              displayOrder: 4,
            },
            {
              cardBrand: 'DINERS CLUB',
              cardBrandCode: 'DIN',
              enabled3ds: false,
              displayOrder: 23,
            },
          ],
          APL: [
            {
              cardBrand: 'AMERICAN EXPRESS',
              cardBrandCode: 'AME',
              enabled3ds: false,
              displayOrder: 7,
            },
            {
              cardBrand: 'DISCOVER',
              cardBrandCode: 'DIS',
              enabled3ds: false,
              displayOrder: 8,
            },
            {
              cardBrand: 'VISA',
              cardBrandCode: 'VIS',
              enabled3ds: false,
              displayOrder: 9,
            },
            {
              cardBrand: 'MASTERCARD',
              cardBrandCode: 'MAS',
              enabled3ds: false,
              displayOrder: 10,
            },
          ],
          GGL: [
            {
              cardBrand: 'AMERICAN EXPRESS',
              cardBrandCode: 'AME',
              enabled3ds: false,
              displayOrder: 11,
            },
            {
              cardBrand: 'DISCOVER',
              cardBrandCode: 'DIS',
              enabled3ds: false,
              displayOrder: 12,
            },
            {
              cardBrand: 'VISA',
              cardBrandCode: 'VIS',
              enabled3ds: false,
              displayOrder: 13,
            },
            {
              cardBrand: 'MASTERCARD',
              cardBrandCode: 'MAS',
              enabled3ds: false,
              displayOrder: 14,
            },
          ],
        },
        ignoreAvs: false,
        ignoreCvv: false,
      },
      usedBy: {
        components: ['comp_payment_001'],
        pages: ['payment'],
      },
    },
    {
      id: 'int_storedvalue_001',
      type: 'payment',
      provider: 'GiftCard',
      enabled: true,
      initStrategy: {
        timing: 'critical',
        blocksRendering: true,
        requiredForPages: ['payment'],
      },
      credentials: {
        merchantId: '3',
      },
      settings: {
        paymentMethods: {
          SVC: [
            {
              cardBrand: 'STORED VALUE CARD',
              cardBrandCode: 'SVC',
              enabled3ds: false,
              displayOrder: 24,
            },
          ],
        },
        ignoreAvs: false,
        ignoreCvv: false,
      },
      usedBy: {
        components: ['comp_payment_001'],
        pages: ['payment'],
      },
    },
    {
      id: 'int_paypal_001',
      type: 'payment',
      provider: 'PayPal',
      enabled: true,
      initStrategy: {
        timing: 'critical',
        blocksRendering: true,
        requiredForPages: ['checkout'],
      },
      credentials: {
        clientId: 'some_api_key',
      },
      settings: {
        fundingSources: [
          {
            source: 'paypal',
            style: {
              color: 'gold',
              label: 'checkout',
            },
          },
          {
            source: 'paylater',
          },
          {
            source: 'venmo',
          },
        ],
      },
      usedBy: {
        components: ['comp_payment_001'],
        pages: ['checkout'],
      },
    },
    {
      id: 'int_accertify_001',
      type: 'fraud-detection',
      provider: 'Accertify',
      enabled: true,
      initStrategy: {
        timing: 'prefetch',
        blocksRendering: false,
        requiredForPages: ['checkout'],
      },
      credentials: {
        clientId: 'some_api_key',
      },
      settings: {},
      usedBy: {
        components: ['comp_payment_001'],
        pages: ['checkout'],
      },
    },
    {
      id: 'int_risk_001',
      type: 'fraud-detection',
      provider: 'RiskManagement',
      enabled: true,
      initStrategy: {
        timing: 'lazy',
        blocksRendering: false,
        requiredForPages: [],
      },
      credentials: {
        clientId: 'some_api_key',
      },
      settings: {},
      usedBy: {
        components: [],
        pages: ['checkout'],
      },
    },
    {
      id: 'int_ticketguardian_001',
      type: 'insurance',
      provider: 'TicketGuardian',
      enabled: true,
      initStrategy: {
        timing: 'prefetch',
        blocksRendering: false,
        requiredForPages: ['insurance'],
      },
      credentials: {
        apiKey: 'some_api_key',
      },
      settings: {
        splitInsurance: false,
      },
      usedBy: {
        components: ['comp_insurance_001'],
        pages: ['insurance'],
      },
    },
    {
      id: 'int_donation_001',
      type: 'donation',
      provider: 'CustomDonationProvider',
      enabled: true,
      initStrategy: {
        timing: 'lazy',
        blocksRendering: false,
        requiredForPages: ['donation'],
      },
      credentials: {},
      settings: {
        amounts: [1, 2, 5],
        roundingMultiple: 0,
        enableRounding: false,
        enableCustomAmount: true,
        splitDonation: false,
      },
      usedBy: {
        components: ['comp_donation_001'],
        pages: ['donation'],
      },
    },
  ],
  locales: {
    locale: 'en-US',
    namespaces: [],
  },
};
