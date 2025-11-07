function getDefaultCourierType(courier) {
    switch (courier) {
        case 'jne': return 'reg'
        case 'sicepat': return 'reg'
        case 'anteraja': return 'reg'
        case 'idexpress': return 'reg'
        case 'paxel': return 'small'
        case 'jnt': return 'ez'
        default: return 'reg'
    }
}

export default getDefaultCourierType