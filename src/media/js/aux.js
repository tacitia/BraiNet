/*
    This function should be used to determine if an array contains a given 
    element if that object might differ slightly from the version stored in 
    the array (but will still have the same key)
*/
function contains(array, element) {
    var length = array.length;
    for (var i = 0; i < length; ++i) {
        if (element.key === array[i].key) {
            return i;
        }
    }
    return -1;
}

function generateKeyForNodeLinkMap(a, b) {
    var min_key = Math.min(a.key, b.key);
    var max_key = Math.max(a.key, b.key);
    return min_key + "-" + max_key;
}
