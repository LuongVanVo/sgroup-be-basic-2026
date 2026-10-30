import express from 'express';
import authRouter from './auth.route.js';
import userRouter from './user.route.js';
import categoryRouter from './category.route.js';
import productRouter from './product.route.js';
import orderRouter from './order.route.js';

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/users', userRouter);
rootRouter.use('/categories', categoryRouter);
rootRouter.use('/products', productRouter);
rootRouter.use('/orders', orderRouter);

export default rootRouter;
