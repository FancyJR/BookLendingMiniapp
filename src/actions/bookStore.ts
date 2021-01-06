import { UPDATE_STATE } from '../constants/bookStore'
import request from '../utils/request';

export const updataState = (bookList) => {
    return {
        type: UPDATE_STATE,
        payload: bookList
    }
}

// 异步的action
export function queryBookList(params: any) {
    return dispatch => {
        request('https://shiyunidt.cn/getBookList', {
            book_status: params.current
        }).then(res => {
            const { data, statusCode } = res;
            if (statusCode === 200) {
                dispatch(updataState(data))
            }
        }).catch(e => {
            console.log(e)
        });
    }
}
