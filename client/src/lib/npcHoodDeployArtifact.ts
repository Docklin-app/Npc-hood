export const NPC_HOOD_DEPLOY_ARTIFACT = {
  "abi": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "initialBaseURI",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "DirectPaymentDisabled",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721IncorrectOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721InsufficientApproval",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721NonexistentToken",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "expected",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "received",
          "type": "uint256"
        }
      ],
      "name": "IncorrectPayment",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidQuantity",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "MintNotOpen",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NothingToWithdraw",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "requested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "remaining",
          "type": "uint256"
        }
      ],
      "name": "SupplyExceeded",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "requested",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maximum",
          "type": "uint256"
        }
      ],
      "name": "TransactionLimitExceeded",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TransferFailed",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "newBaseURI",
          "type": "string"
        }
      ],
      "name": "CollectionBaseURIChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isOpen",
          "type": "bool"
        }
      ],
      "name": "MintOpenStatusChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "minter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "paid",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountPaid",
          "type": "uint256"
        }
      ],
      "name": "NpcHoodMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "ProceedsWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [],
      "name": "FREE_MINT_FEE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_PER_TX",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_SUPPLY",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "PAID_MINT_PRICE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        }
      ],
      "name": "freeMint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "mintOpen",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "quantity",
          "type": "uint256"
        }
      ],
      "name": "paidMint",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "newBaseURI",
          "type": "string"
        }
      ],
      "name": "setCollectionBaseURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "isOpen",
          "type": "bool"
        }
      ],
      "name": "setMintOpen",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalMinted",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "bytecode": "0x60806040523480156200001157600080fd5b5060405162003633380380620036338339818101604052810190620000379190620003cb565b336040518060400160405280600881526020017f4e504320484f4f440000000000000000000000000000000000000000000000008152506040518060400160405280600481526020017f484f4f44000000000000000000000000000000000000000000000000000000008152508160009081620000b5919062000667565b508060019081620000c7919062000667565b505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036200013f5760006040517f1e4fbdf700000000000000000000000000000000000000000000000000000000815260040162000136919062000793565b60405180910390fd5b62000150816200017260201b60201c565b50600160078190555080600a90816200016a919062000667565b5050620007b0565b6000600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620002a18262000256565b810181811067ffffffffffffffff82111715620002c357620002c262000267565b5b80604052505050565b6000620002d862000238565b9050620002e6828262000296565b919050565b600067ffffffffffffffff82111562000309576200030862000267565b5b620003148262000256565b9050602081019050919050565b60005b838110156200034157808201518184015260208101905062000324565b60008484015250505050565b6000620003646200035e84620002eb565b620002cc565b90508281526020810184848401111562000383576200038262000251565b5b6200039084828562000321565b509392505050565b600082601f830112620003b057620003af6200024c565b5b8151620003c28482602086016200034d565b91505092915050565b600060208284031215620003e457620003e362000242565b5b600082015167ffffffffffffffff81111562000405576200040462000247565b5b620004138482850162000398565b91505092915050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200046f57607f821691505b60208210810362000485576200048462000427565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302620004ef7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620004b0565b620004fb8683620004b0565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600062000548620005426200053c8462000513565b6200051d565b62000513565b9050919050565b6000819050919050565b620005648362000527565b6200057c62000573826200054f565b848454620004bd565b825550505050565b600090565b6200059362000584565b620005a081848462000559565b505050565b5b81811015620005c857620005bc60008262000589565b600181019050620005a6565b5050565b601f8211156200061757620005e1816200048b565b620005ec84620004a0565b81016020851015620005fc578190505b620006146200060b85620004a0565b830182620005a5565b50505b505050565b600082821c905092915050565b60006200063c600019846008026200061c565b1980831691505092915050565b600062000657838362000629565b9150826002028217905092915050565b62000672826200041c565b67ffffffffffffffff8111156200068e576200068d62000267565b5b6200069a825462000456565b620006a7828285620005cc565b600060209050601f831160018114620006df5760008415620006ca578287015190505b620006d6858262000649565b86555062000746565b601f198416620006ef866200048b565b60005b828110156200071957848901518255600182019150602085019450602081019050620006f2565b8683101562000739578489015162000735601f89168262000629565b8355505b6001600288020188555050505b505050505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006200077b826200074e565b9050919050565b6200078d816200076e565b82525050565b6000602082019050620007aa600083018462000782565b92915050565b612e7380620007c06000396000f3fe6080604052600436106101a05760003560e01c8063715018a6116100ec578063a2309ff81161008a578063e985e9c511610064578063e985e9c5146105ee578063f2fde38b1461062b578063f43a22dc14610654578063f8004d311461067f576101d7565b8063a2309ff81461055d578063b88d4fde14610588578063c87b56dd146105b1576101d7565b80638da5cb5b116100c65780638da5cb5b146104b357806395a376f4146104de57806395d89b4114610509578063a22cb46514610534576101d7565b8063715018a6146104555780637c928fe91461046c57806388a5248714610488576101d7565b806332cb6b0c1161015957806342842e0e1161013357806342842e0e146103965780636352211e146103bf57806365cde733146103fc57806370a0823114610418576101d7565b806332cb6b0c1461032b5780633c990734146103565780633ccfd60b1461037f576101d7565b806301ffc9a71461020957806306fdde0314610246578063081812fc14610271578063095ea7b3146102ae57806323b872dd146102d757806324bbd04914610300576101d7565b366101d7576040517fc7f925dd00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6040517fc7f925dd00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b34801561021557600080fd5b50610230600480360381019061022b919061218c565b6106a8565b60405161023d91906121d4565b60405180910390f35b34801561025257600080fd5b5061025b61078a565b604051610268919061227f565b60405180910390f35b34801561027d57600080fd5b50610298600480360381019061029391906122d7565b61081c565b6040516102a59190612345565b60405180910390f35b3480156102ba57600080fd5b506102d560048036038101906102d0919061238c565b610838565b005b3480156102e357600080fd5b506102fe60048036038101906102f991906123cc565b61084e565b005b34801561030c57600080fd5b50610315610950565b60405161032291906121d4565b60405180910390f35b34801561033757600080fd5b50610340610963565b60405161034d919061242e565b60405180910390f35b34801561036257600080fd5b5061037d600480360381019061037891906124ae565b610969565b005b34801561038b57600080fd5b506103946109c0565b005b3480156103a257600080fd5b506103bd60048036038101906103b891906123cc565b610b19565b005b3480156103cb57600080fd5b506103e660048036038101906103e191906122d7565b610b39565b6040516103f39190612345565b60405180910390f35b610416600480360381019061041191906122d7565b610b4b565b005b34801561042457600080fd5b5061043f600480360381019061043a91906124fb565b610b72565b60405161044c919061242e565b60405180910390f35b34801561046157600080fd5b5061046a610c2c565b005b610486600480360381019061048191906122d7565b610c40565b005b34801561049457600080fd5b5061049d610c66565b6040516104aa919061242e565b60405180910390f35b3480156104bf57600080fd5b506104c8610c70565b6040516104d59190612345565b60405180910390f35b3480156104ea57600080fd5b506104f3610c9a565b604051610500919061242e565b60405180910390f35b34801561051557600080fd5b5061051e610ca5565b60405161052b919061227f565b60405180910390f35b34801561054057600080fd5b5061055b60048036038101906105569190612554565b610d37565b005b34801561056957600080fd5b50610572610d4d565b60405161057f919061242e565b60405180910390f35b34801561059457600080fd5b506105af60048036038101906105aa91906126c4565b610d53565b005b3480156105bd57600080fd5b506105d860048036038101906105d391906122d7565b610d78565b6040516105e5919061227f565b60405180910390f35b3480156105fa57600080fd5b5061061560048036038101906106109190612747565b610de1565b60405161062291906121d4565b60405180910390f35b34801561063757600080fd5b50610652600480360381019061064d91906124fb565b610e75565b005b34801561066057600080fd5b50610669610efb565b604051610676919061242e565b60405180910390f35b34801561068b57600080fd5b506106a660048036038101906106a19190612787565b610f00565b005b60007f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061077357507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b80610783575061078282610f5c565b5b9050919050565b606060008054610799906127e3565b80601f01602080910402602001604051908101604052809291908181526020018280546107c5906127e3565b80156108125780601f106107e757610100808354040283529160200191610812565b820191906000526020600020905b8154815290600101906020018083116107f557829003601f168201915b5050505050905090565b600061082782610fc6565b506108318261104e565b9050919050565b61084a828261084561108b565b611093565b5050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036108c05760006040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016108b79190612345565b60405180910390fd5b60006108d483836108cf61108b565b6110a5565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461094a578382826040517f64283d7b00000000000000000000000000000000000000000000000000000000815260040161094193929190612814565b60405180910390fd5b50505050565b600960009054906101000a900460ff1681565b61271081565b6109716112bf565b8181600a9182610982929190612a02565b507f531c4110370cc1b37e60c6f7faa49f5d4714c988a6ca25f724d838d43bd2bd2a82826040516109b4929190612aff565b60405180910390a15050565b6109c86112bf565b6109d0611346565b600047905060008103610a0f576040517fd0d04f6000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000610a19610c70565b905060008173ffffffffffffffffffffffffffffffffffffffff1683604051610a4190612b54565b60006040518083038185875af1925050503d8060008114610a7e576040519150601f19603f3d011682016040523d82523d6000602084013e610a83565b606091505b5050905080610abe576040517f90b8ec1800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff167f0f2fb75cc1977a496e94837f859e957f68e26e70dc1b75d9945ee92ae57969ba84604051610b04919061242e565b60405180910390a2505050610b1761138c565b565b610b3483838360405180602001604052806000815250610d53565b505050565b6000610b4482610fc6565b9050919050565b610b53611346565b610b673382660110d9316ec0006001611396565b610b6f61138c565b50565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610be55760006040517f89c62b64000000000000000000000000000000000000000000000000000000008152600401610bdc9190612345565b60405180910390fd5b600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610c346112bf565b610c3e60006115c5565b565b610c48611346565b610c5b3382655af3107a40006000611396565b610c6361138c565b50565b655af3107a400081565b6000600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b660110d9316ec00081565b606060018054610cb4906127e3565b80601f0160208091040260200160405190810160405280929190818152602001828054610ce0906127e3565b8015610d2d5780601f10610d0257610100808354040283529160200191610d2d565b820191906000526020600020905b815481529060010190602001808311610d1057829003601f168201915b5050505050905090565b610d49610d4261108b565b838361168b565b5050565b60085481565b610d5e84848461084e565b610d72610d6961108b565b858585856117fa565b50505050565b6060610d8382610fc6565b506000610d8e6119ab565b90506000815111610dae5760405180602001604052806000815250610dd9565b80610db884611a3d565b604051602001610dc9929190612ba5565b6040516020818303038152906040525b915050919050565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b610e7d6112bf565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610eef5760006040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401610ee69190612345565b60405180910390fd5b610ef8816115c5565b50565b601481565b610f086112bf565b80600960006101000a81548160ff0219169083151502179055507fd5a826864bf9c1f5490c1d0008af5956fafcf48324ebc8039d4efeb7e4003fec81604051610f5191906121d4565b60405180910390a150565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b600080610fd283611b0b565b9050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361104557826040517f7e27328900000000000000000000000000000000000000000000000000000000815260040161103c919061242e565b60405180910390fd5b80915050919050565b60006004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b600033905090565b6110a08383836001611b48565b505050565b6000806110b184611b0b565b9050600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16146110f3576110f2818486611d0d565b5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461118457611135600085600080611b48565b6001600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b600073ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1614611207576001600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b846002600086815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b6112c761108b565b73ffffffffffffffffffffffffffffffffffffffff166112e5610c70565b73ffffffffffffffffffffffffffffffffffffffff16146113445761130861108b565b6040517f118cdaa700000000000000000000000000000000000000000000000000000000815260040161133b9190612345565b60405180910390fd5b565b600260075403611382576040517f3ee5aeb500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6002600781905550565b6001600781905550565b600960009054906101000a900460ff166113dc576040517f951b974f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60008303611416576040517f524f409b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b601483111561145f578260146040517f9d3f5695000000000000000000000000000000000000000000000000000000008152600401611456929190612bc9565b60405180910390fd5b60006008546127106114719190612c21565b9050808411156114ba5783816040517fe76a5f240000000000000000000000000000000000000000000000000000000081526004016114b1929190612bc9565b60405180910390fd5b600084846114c89190612c55565b90508034146115105780346040517f0d35e921000000000000000000000000000000000000000000000000000000008152600401611507929190612bc9565b60405180910390fd5b600060016008546115219190612c97565b905085600860008282546115359190612c97565b9250508190555060005b868110156115695761155c8882846115579190612c97565b611dd1565b808060010191505061153f565b508673ffffffffffffffffffffffffffffffffffffffff167f80b902d32f96333b9bcec31d02e99e4306e7ed2118388c790f66a56a9d9bb8a88786856040516115b493929190612ccb565b60405180910390a250505050505050565b6000600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905081600660006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036116fc57816040517f5b08ba180000000000000000000000000000000000000000000000000000000081526004016116f39190612345565b60405180910390fd5b80600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31836040516117ed91906121d4565b60405180910390a3505050565b60008373ffffffffffffffffffffffffffffffffffffffff163b11156119a4578273ffffffffffffffffffffffffffffffffffffffff1663150b7a02868685856040518563ffffffff1660e01b81526004016118599493929190612d57565b6020604051808303816000875af192505050801561189557506040513d601f19601f820116820180604052508101906118929190612db8565b60015b611919573d80600081146118c5576040519150601f19603f3d011682016040523d82523d6000602084013e6118ca565b606091505b50600081510361191157836040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016119089190612345565b60405180910390fd5b805160208201fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916146119a257836040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016119999190612345565b60405180910390fd5b505b5050505050565b6060600a80546119ba906127e3565b80601f01602080910402602001604051908101604052809291908181526020018280546119e6906127e3565b8015611a335780601f10611a0857610100808354040283529160200191611a33565b820191906000526020600020905b815481529060010190602001808311611a1657829003601f168201915b5050505050905090565b606060006001611a4c84611def565b01905060008167ffffffffffffffff811115611a6b57611a6a612599565b5b6040519080825280601f01601f191660200182016040528015611a9d5781602001600182028036833780820191505090505b509050600082602083010190505b600115611b00578080600190039150507f3031323334353637383961626364656600000000000000000000000000000000600a86061a8153600a8581611af457611af3612de5565b5b04945060008503611aab575b819350505050919050565b60006002600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b8080611b815750600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b15611cb5576000611b9184610fc6565b9050600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015611bfc57508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b8015611c0f5750611c0d8184610de1565b155b15611c5157826040517fa9fbf51f000000000000000000000000000000000000000000000000000000008152600401611c489190612345565b60405180910390fd5b8115611cb357838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b836004600085815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b611d18838383611f42565b611dcc57600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603611d8d57806040517f7e273289000000000000000000000000000000000000000000000000000000008152600401611d84919061242e565b60405180910390fd5b81816040517f177e802f000000000000000000000000000000000000000000000000000000008152600401611dc3929190612e14565b60405180910390fd5b505050565b611deb828260405180602001604052806000815250612003565b5050565b600080600090507a184f03e93ff9f4daa797ed6e38ed64bf6a1f0100000000000000008310611e4d577a184f03e93ff9f4daa797ed6e38ed64bf6a1f0100000000000000008381611e4357611e42612de5565b5b0492506040810190505b6d04ee2d6d415b85acef81000000008310611e8a576d04ee2d6d415b85acef81000000008381611e8057611e7f612de5565b5b0492506020810190505b662386f26fc100008310611eb957662386f26fc100008381611eaf57611eae612de5565b5b0492506010810190505b6305f5e1008310611ee2576305f5e1008381611ed857611ed7612de5565b5b0492506008810190505b6127108310611f07576127108381611efd57611efc612de5565b5b0492506004810190505b60648310611f2a5760648381611f2057611f1f612de5565b5b0492506002810190505b600a8310611f39576001810190505b80915050919050565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015611ffa57508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480611fbb5750611fba8484610de1565b5b80611ff957508273ffffffffffffffffffffffffffffffffffffffff16611fe18361104e565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b61200d8383612027565b61202261201861108b565b60008585856117fa565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036120995760006040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016120909190612345565b60405180910390fd5b60006120a7838360006110a5565b9050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461211b5760006040517f73c6ac6e0000000000000000000000000000000000000000000000000000000081526004016121129190612345565b60405180910390fd5b505050565b6000604051905090565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b61216981612134565b811461217457600080fd5b50565b60008135905061218681612160565b92915050565b6000602082840312156121a2576121a161212a565b5b60006121b084828501612177565b91505092915050565b60008115159050919050565b6121ce816121b9565b82525050565b60006020820190506121e960008301846121c5565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561222957808201518184015260208101905061220e565b60008484015250505050565b6000601f19601f8301169050919050565b6000612251826121ef565b61225b81856121fa565b935061226b81856020860161220b565b61227481612235565b840191505092915050565b600060208201905081810360008301526122998184612246565b905092915050565b6000819050919050565b6122b4816122a1565b81146122bf57600080fd5b50565b6000813590506122d1816122ab565b92915050565b6000602082840312156122ed576122ec61212a565b5b60006122fb848285016122c2565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061232f82612304565b9050919050565b61233f81612324565b82525050565b600060208201905061235a6000830184612336565b92915050565b61236981612324565b811461237457600080fd5b50565b60008135905061238681612360565b92915050565b600080604083850312156123a3576123a261212a565b5b60006123b185828601612377565b92505060206123c2858286016122c2565b9150509250929050565b6000806000606084860312156123e5576123e461212a565b5b60006123f386828701612377565b935050602061240486828701612377565b9250506040612415868287016122c2565b9150509250925092565b612428816122a1565b82525050565b6000602082019050612443600083018461241f565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f84011261246e5761246d612449565b5b8235905067ffffffffffffffff81111561248b5761248a61244e565b5b6020830191508360018202830111156124a7576124a6612453565b5b9250929050565b600080602083850312156124c5576124c461212a565b5b600083013567ffffffffffffffff8111156124e3576124e261212f565b5b6124ef85828601612458565b92509250509250929050565b6000602082840312156125115761251061212a565b5b600061251f84828501612377565b91505092915050565b612531816121b9565b811461253c57600080fd5b50565b60008135905061254e81612528565b92915050565b6000806040838503121561256b5761256a61212a565b5b600061257985828601612377565b925050602061258a8582860161253f565b9150509250929050565b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6125d182612235565b810181811067ffffffffffffffff821117156125f0576125ef612599565b5b80604052505050565b6000612603612120565b905061260f82826125c8565b919050565b600067ffffffffffffffff82111561262f5761262e612599565b5b61263882612235565b9050602081019050919050565b82818337600083830152505050565b600061266761266284612614565b6125f9565b90508281526020810184848401111561268357612682612594565b5b61268e848285612645565b509392505050565b600082601f8301126126ab576126aa612449565b5b81356126bb848260208601612654565b91505092915050565b600080600080608085870312156126de576126dd61212a565b5b60006126ec87828801612377565b94505060206126fd87828801612377565b935050604061270e878288016122c2565b925050606085013567ffffffffffffffff81111561272f5761272e61212f565b5b61273b87828801612696565b91505092959194509250565b6000806040838503121561275e5761275d61212a565b5b600061276c85828601612377565b925050602061277d85828601612377565b9150509250929050565b60006020828403121561279d5761279c61212a565b5b60006127ab8482850161253f565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806127fb57607f821691505b60208210810361280e5761280d6127b4565b5b50919050565b60006060820190506128296000830186612336565b612836602083018561241f565b6128436040830184612336565b949350505050565b600082905092915050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026128b87fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261287b565b6128c2868361287b565b95508019841693508086168417925050509392505050565b6000819050919050565b60006128ff6128fa6128f5846122a1565b6128da565b6122a1565b9050919050565b6000819050919050565b612919836128e4565b61292d61292582612906565b848454612888565b825550505050565b600090565b612942612935565b61294d818484612910565b505050565b5b818110156129715761296660008261293a565b600181019050612953565b5050565b601f8211156129b65761298781612856565b6129908461286b565b8101602085101561299f578190505b6129b36129ab8561286b565b830182612952565b50505b505050565b600082821c905092915050565b60006129d9600019846008026129bb565b1980831691505092915050565b60006129f283836129c8565b9150826002028217905092915050565b612a0c838361284b565b67ffffffffffffffff811115612a2557612a24612599565b5b612a2f82546127e3565b612a3a828285612975565b6000601f831160018114612a695760008415612a57578287013590505b612a6185826129e6565b865550612ac9565b601f198416612a7786612856565b60005b82811015612a9f57848901358255600182019150602085019450602081019050612a7a565b86831015612abc5784890135612ab8601f8916826129c8565b8355505b6001600288020188555050505b50505050505050565b6000612ade83856121fa565b9350612aeb838584612645565b612af483612235565b840190509392505050565b60006020820190508181036000830152612b1a818486612ad2565b90509392505050565b600081905092915050565b50565b6000612b3e600083612b23565b9150612b4982612b2e565b600082019050919050565b6000612b5f82612b31565b9150819050919050565b600081905092915050565b6000612b7f826121ef565b612b898185612b69565b9350612b9981856020860161220b565b80840191505092915050565b6000612bb18285612b74565b9150612bbd8284612b74565b91508190509392505050565b6000604082019050612bde600083018561241f565b612beb602083018461241f565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000612c2c826122a1565b9150612c37836122a1565b9250828203905081811115612c4f57612c4e612bf2565b5b92915050565b6000612c60826122a1565b9150612c6b836122a1565b9250828202612c79816122a1565b91508282048414831517612c9057612c8f612bf2565b5b5092915050565b6000612ca2826122a1565b9150612cad836122a1565b9250828201905080821115612cc557612cc4612bf2565b5b92915050565b6000606082019050612ce0600083018661241f565b612ced60208301856121c5565b612cfa604083018461241f565b949350505050565b600081519050919050565b600082825260208201905092915050565b6000612d2982612d02565b612d338185612d0d565b9350612d4381856020860161220b565b612d4c81612235565b840191505092915050565b6000608082019050612d6c6000830187612336565b612d796020830186612336565b612d86604083018561241f565b8181036060830152612d988184612d1e565b905095945050505050565b600081519050612db281612160565b92915050565b600060208284031215612dce57612dcd61212a565b5b6000612ddc84828501612da3565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000604082019050612e296000830185612336565b612e36602083018461241f565b939250505056fea26469706673582212205f6a8e4a6a974a3531ecf29e408f712c1f0768abff318689e3a533c78c6802f064736f6c63430008180033"
} as const;
