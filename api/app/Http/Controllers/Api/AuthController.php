<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\UpdateProfileRequest;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private CartService $cartService
    ) {
    }

    public function register(
        RegisterRequest $request
    ): JsonResponse {
        // Captura o cookie antes da autenticação.
        $guestToken = $this->guestToken($request);

        $user = $this->authService->register(
            $request->validated()
        );

        // Autenticação com sessão, sem Bearer token.
        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        // Transfere os itens do visitante para a conta.
        $merge = $this->cartService->mergeGuestCart(
            $guestToken,
            $user
        );

        $this->forgetGuestCookie($guestToken);

        return (new UserResource($user))
            ->additional([
                'cart_merge' => $merge,
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function login(
        LoginRequest $request
    ): UserResource {
        // Preserva a identificação do carrinho visitante.
        $guestToken = $this->guestToken($request);

        $authenticated = $this->authService->login(
            $request->validated()
        );

        if (!$authenticated) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::guard('web')->user();

        // Une os carrinhos após validar as credenciais.
        $merge = $this->cartService->mergeGuestCart(
            $guestToken,
            $user
        );

        $this->forgetGuestCookie($guestToken);

        return (new UserResource($user))
            ->additional([
                'cart_merge' => $merge,
            ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    private function guestToken(Request $request): ?string
    {
        $token = $request->cookie(
            CartService::GUEST_COOKIE
        );

        return is_string($token) ? $token : null;
    }

    private function forgetGuestCookie(?string $token): void
    {
        if ($token === null) {
            return;
        }

        Cookie::queue(
            Cookie::forget(
                CartService::GUEST_COOKIE,
                '/'
            )
        );
    }

    public function updateProfile(
        UpdateProfileRequest $request
    ): UserResource {
        $user = $this->authService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return new UserResource($user);
    }
}
