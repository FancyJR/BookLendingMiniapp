import { UPDATE_STATE } from '../constants/borrow'
import request from '../utils/request';

export const updataState = (borrowList) => {
    return {
        type: UPDATE_STATE,
        payload: borrowList
    }
}

// 异步的action
export function queryBorrowList(params: any) {
    return dispatch => {
        request('https://shiyunidt.cn/getHaveBorrowBook', {
            phone: params.phone
        }).then(res => {
            const { statusCode, data } = res;
            if (statusCode === 200) {
                dispatch(updataState(data))
            }
        }).catch(e => {
            console.log(e)
        });
    }
}
