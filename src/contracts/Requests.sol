// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

/// @title IERC20Token Interface
/// @dev Interface for ERC20 token contract
interface IERC20Token {
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/// @title Requests Contract
/// @dev Contract to handle payment requests and transfers
contract Requests {
    
    struct Request {
        uint256 requestId;
        address payable from;
        address payable to;
        uint256 amount;
        bool completed;
    }

    mapping (uint256 => Request) internal requests;
    uint256 requestsTracker;
    address cusdaddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    event MakeRequestEvent(address indexed from, address indexed to, uint256 amount);
    event CompleteRequestEvent(uint256 requestId);

    /// @notice Make a new payment request
    /// @param _to The recipient's address
    /// @param _amount The amount to be transferred
    function makeRequest(address _to, uint256 _amount) public {
        Request storage request = requests[requestsTracker];
        request.requestId = requestsTracker;
        request.from = payable(msg.sender);
        request.to = payable(_to);
        request.amount = _amount;
        request.completed = false;

        requestsTracker++;
        emit MakeRequestEvent(msg.sender, _to, _amount);
    }

    /// @notice Complete an existing payment request
    /// @param _requestId The ID of the request to be completed
    function completeRequest(uint256 _requestId) public {
        Request storage request = requests[_requestId];
        require(_requestId >= 0, "Invalid request ID");
        require(
            IERC20Token(cusdaddress).transferFrom(
                msg.sender,
                request.from,
                request.amount * 10**18
            ),
            "Transfer Unsuccessful"
        );
        request.completed = true;
        emit CompleteRequestEvent(_requestId);
    }

    /// @notice Load incoming payment requests from the smart contract
    /// @return _requests An array of incoming payment requests
    function loadIncomingRequests() public view returns (Request[] memory) {
        uint256 requestsCount = 0;
        for (uint256 i = 0; i < requestsTracker; i++) {
            if (requests[i].to == msg.sender) {
                requestsCount++;
            }
        }

        Request[] memory _requests = new Request[](requestsCount);
        uint256 index = 0;
        for (uint256 i = 0; i < requestsTracker; i++) {
            if (requests[i].to == msg.sender) {
                _requests[index] = requests[i];
                index++;
            }
        }

        return _requests;
    }

    /// @notice Load outgoing payment requests from the smart contract
    /// @return _requests An array of outgoing payment requests
    function loadOutgoingRequests() public view returns (Request[] memory) {
        uint256 requestsCount = 0;
        for (uint256 i = 0; i < requestsTracker; i++)
