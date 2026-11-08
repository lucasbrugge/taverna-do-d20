<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartService->current($request);

        return response()->json(
            $this->cartService->summary($cart)
        );
    }

    public function store(
        StoreCartItemRequest $request
    ): JsonResponse {
        $data = $request->validated();

        return response()->json(
            $this->cartService->add(
                $request,
                (int) $data['product_id'],
                (int) $data['quantity']
            )
        );
    }

    public function update(
        UpdateCartItemRequest $request,
        int $item
    ): JsonResponse {
        $data = $request->validated();

        return response()->json(
            $this->cartService->update(
                $request,
                $item,
                (int) $data['quantity']
            )
        );
    }

    public function destroy(
        Request $request,
        int $item
    ): JsonResponse {
        return response()->json(
            $this->cartService->remove($request, $item)
        );
    }
}
