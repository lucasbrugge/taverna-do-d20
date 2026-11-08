<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {
    }

    public function index(
        Request $request
    ): AnonymousResourceCollection {
        return OrderResource::collection(
            $this->orderService->listForUser(
                $request->user()
            )
        );
    }

    public function store(
        StoreOrderRequest $request
    ): JsonResponse {
        $order = $this->orderService->checkout(
            $request->user(),
            (int) $request->validated('address_id')
        );

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(
        Request $request,
        Order $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->show(
                $request->user(),
                $order
            )
        );
    }

    public function pay(
        Request $request,
        Order $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->pay(
                $request->user(),
                $order
            )
        );
    }

    public function cancel(
        Request $request,
        Order $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->cancel(
                $request->user(),
                $order
            )
        );
    }
}
