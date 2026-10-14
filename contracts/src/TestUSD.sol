// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Truva Test USD
/// @notice A valueless ERC-20 payment token for the Truva checkout demo on Bohr testnet, which has
///         no public test stablecoin. Anyone can draw from the faucet; there is no owner, no admin,
///         no mint function besides the faucet, and no upgrade path. Never deploy it to a mainnet.
contract TestUSD {
    string public constant name = "Truva Test USD (no value)";
    string public constant symbol = "tUSD";
    uint8 public constant decimals = 6;

    /// @notice Amount a wallet receives per faucet call: 10,000 tUSD.
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** 6;
    /// @notice Minimum time between faucet calls for one wallet.
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucet;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance();
    error InsufficientAllowance();
    error ZeroAddress();
    error FaucetCooldown(uint256 availableAt);

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
        }
        _transfer(from, to, value);
        return true;
    }

    /// @notice Sends FAUCET_AMOUNT to the caller, at most once per FAUCET_COOLDOWN.
    function faucet() external {
        uint256 last = lastFaucet[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) revert FaucetCooldown(last + FAUCET_COOLDOWN);
        lastFaucet[msg.sender] = block.timestamp;
        totalSupply += FAUCET_AMOUNT;
        unchecked {
            balanceOf[msg.sender] += FAUCET_AMOUNT;
        }
        emit Transfer(address(0), msg.sender, FAUCET_AMOUNT);
    }

    function _transfer(address from, address to, uint256 value) private {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
