<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {
    }

    public function index(
        Request $request
    ): AnonymousResourceCollection {
        $filters = $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    Order::PENDING,
                    Order::PAID,
                    Order::SHIPPED,
                    Order::DELIVERED,
                    Order::CANCELED,
                ]),
            ],
        ]);

        return OrderResource::collection(
            $this->orderService->listForAdmin(
                $filters['status'] ?? null
            )
        );
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ): OrderResource {
        $data = $request->validated();

        return new OrderResource(
            $this->orderService->advanceStatus(
                $order,
                $data['status']
            )
        );
    }
}
