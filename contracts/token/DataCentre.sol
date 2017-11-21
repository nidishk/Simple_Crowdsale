pragma solidity ^0.4.11;

import "../ownership/Ownable.sol";

contract DataCentre is Ownable {
    struct Crate {
        mapping(bytes32 => uint256) values;
        mapping(bytes32 => address) addresses;
        mapping(bytes32 => bool) bools;
        mapping(address => uint256) bals;
    }

    mapping(bytes32 => Crate) crates;

    function setValue(bytes32 _crate, bytes32 _key, uint256 _value) onlyOwner {
        crates[_crate].values[_key] = _value;
    }

    function getValue(bytes32 _crate, bytes32 _key) constant returns(uint256) {
        return crates[_crate].values[_key];
    }

    function setAddress(bytes32 _crate, bytes32 _key, address _value) onlyOwner {
        crates[_crate].addresses[_key] = _value;
    }

    function getAddress(bytes32 _crate, bytes32 _key) constant returns(address) {
        return crates[_crate].addresses[_key];
    }

    function setBool(bytes32 _crate, bytes32 _key, bool _value) onlyOwner {
        crates[_crate].bools[_key] = _value;
    }

    function getBool(bytes32 _crate, bytes32 _key) constant returns(bool) {
        return crates[_crate].bools[_key];
    }

    function setBalanace(bytes32 _crate, address _key, uint256 _value) onlyOwner {
        crates[_crate].bals[_key] = _value;
    }

    function getBalanace(bytes32 _crate, address _key) constant returns(uint256) {
        return crates[_crate].bals[_key];
    }
}
