// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TypingGame {
    struct Score {
        address player;
        uint256 wpm;
        uint256 accuracy;
        uint256 timestamp;
    }

    Score[] public highScores;
    mapping(address => uint256) public bestWpm;

    event NewHighScore(address indexed player, uint256 wpm, uint256 accuracy);

    function submitScore(uint256 _wpm, uint256 _accuracy) public {
        require(_wpm > 0, "WPM must be greater than 0");
        require(_accuracy <= 100, "Accuracy cannot exceed 100%");

        highScores.push(Score({
            player: msg.sender,
            wpm: _wpm,
            accuracy: _accuracy,
            timestamp: block.timestamp
        }));

        if (_wpm > bestWpm[msg.sender]) {
            bestWpm[msg.sender] = _wpm;
        }

        emit NewHighScore(msg.sender, _wpm, _accuracy);
    }

    function getHighScores() public view returns (Score[] memory) {
        return highScores;
    }
}
