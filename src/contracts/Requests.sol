// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

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

    // Make new request
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

    // Complete an existing request
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

    // Load incoming requests from smart contract
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

    // Load outgoing requests from smart contract
    function loadOutgoingRequests() public view returns (Request[] memory) {
        uint256 requestsCount = 0;
        for (uint256 i = 0; i < requestsTracker; i++) {
            if (requests[i].from == msg.sender) {
                requestsCount++;
            }
        }

        Request[] memory _requests = new Request[](requestsCount);
        uint256 index = 0;
        for (uint256 i = 0; i < requestsTracker; i++) {
            if (requests[i].from == msg.sender) {
                _requests[index] = requests[i];
                index++;
            }
        }

        return _requests;
    }
}