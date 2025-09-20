### Block 1: Genesis Block (Creates Initial Money)

```
{
    "id": "f64b04994895eb9ea368641eba51fd789dc13124390e83fb65254952814a72f6",
    "height": 1,
    "transactions": [
        {
            "id": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            "inputs": [],
            "outputs": [
                {
                    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                    "value": 50
                }
            ]
        }
    ]
}
```

### Transfer from Address 1 to Addresses 2 and 3

```
{
    "id": "3622845b6c3e25054376334150161a2cc2894ca68415b010916af7250de96953",
    "height": 2,
    "transactions": [
        {
            "id": "2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
            "inputs": [
                {
                    "txId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
                    "index": 0
                }
            ],
            "outputs": [
                {
                    "address": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                    "value": 20
                },
                {
                    "address": "1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4",
                    "value": 30
                }
            ]
        }
    ]
}
```

```
{
    "id": "3f0b37c35bc3ac9ebde8e5ee19fecdf859bbbd3c1f48af422edf6000371a20a8",
    "height": 3,
    "transactions": [
        {
            "id": "3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
            "inputs": [
                {
                    "txId": "2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
                    "index": 1
                }
            ],
            "outputs": [
                {
                    "address": "1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6",
                    "value": 10
                },
                {
                    "address": "1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8",
                    "value": 10
                },
                {
                    "address": "1F7kwW9iIx6Z6Mi1D3G3vH1eI6lJ7nO8qQ9",
                    "value": 10
                }
            ]
        }
    ]
}
```