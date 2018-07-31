/**
 * @Author: acexy@thankjava.com
 * 2018/7/26
 * @Description:
 */

const Router = require('koa-router');

const authTokenModel = require('../models/authToken');
const baseController = require('./baseController');
const asyncRedisClient = require('../lib/asyncRedis').client;
const redisKey = require('../const/redisKey');


module.exports = new Router(

).get('list', async ctx => {
    let userId = ctx.state.authInfo.id;
    let tokens = await authTokenModel.selectByUserIdSortByCreateTime(userId);
    if (tokens) {
        for (let index in tokens) {
            tokens[index].token = tokens[index].token.replace(baseController.REG.TOKEN_ENCODE, '$1******$2');
            delete tokens[index].userId;
        }
        return baseController.response(ctx, {list: tokens});
    }
    baseController.response(ctx);
}).post('del', async ctx => {
    let params = ctx.request.body;
    if (!params || !params.ids) return baseController.response400(ctx);
    let userId = ctx.state.authInfo.id;
    let tokens = await authTokenModel.selectOwnByIds(params.ids, userId);
    for (let index in tokens) {
        await asyncRedisClient.delAsync(redisKey.AUTH_TOKEN(tokens[index].token));
    }
    await authTokenModel.removeOwnByIds(params.ids, userId);
    baseController.response(ctx);
}).routes();