// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CeloTypeGame {
    address public owner;
    uint256 public submitFee = 0.01 ether; // Default 0.01 CELO fee

    struct Score {
        address player;
        uint256 wpm;
        uint256 accuracy;
        uint256 points;
        uint256 timestamp;
    }

    Score[] public allScores;
    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public bestWpm;

    event ScoreSubmitted(address indexed player, uint256 wpm, uint256 accuracy, uint256 pointsEarned);
    event FeeUpdated(uint256 newFee);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this");
        _;
    }

    // Update the required CELO fee to save a score
    function setSubmitFee(uint256 _newFee) external onlyOwner {
        submitFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    // Submit a score, pay the fee, and earn points
    function submitScore(uint256 _wpm, uint256 _accuracy) public payable {
        require(msg.value >= submitFee, "Insufficient CELO fee supplied");
        require(_wpm > 0, "WPM must be greater than 0");
        require(_accuracy <= 100, "Accuracy cannot exceed 100%");

        // Points are calculated as: WPM scaled by accuracy percentage 
        // Example: 100 WPM at 95% Accuracy = 95 Points.
        uint256 pointsEarned = (_wpm * _accuracy) / 100;

        userPoints[msg.sender] += pointsEarned;

        if (_wpm > bestWpm[msg.sender]) {
            bestWpm[msg.sender] = _wpm;
        }

        allScores.push(Score({
            player: msg.sender,
            wpm: _wpm,
            accuracy: _accuracy,
            points: pointsEarned,
            timestamp: block.timestamp
        }));

        emit ScoreSubmitted(msg.sender, _wpm, _accuracy, pointsEarned);
    }

    // Get the total number of scores submitted globally
    function getTotalScoresCount() public view returns (uint256) {
        return allScores.length;
    }

    // Owner function to withdraw collected CELO fees
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }
}
