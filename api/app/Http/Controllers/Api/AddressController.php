<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AddressController extends Controller
{
    public function index(
        Request $request
    ): AnonymousResourceCollection {
        return AddressResource::collection(
            $request->user()->addresses()->latest()->get()
        );
    }

    public function store(
        AddressRequest $request
    ): JsonResponse {
        $address = $request->user()->addresses()->create(
            $request->validated()
        );

        return (new AddressResource($address))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        AddressRequest $request,
        Address $address
    ): AddressResource {
        abort_unless(
            (int) $address->user_id ===
                (int) $request->user()->id,
            403
        );

        $address->update($request->validated());

        return new AddressResource($address->refresh());
    }

    public function destroy(
        Request $request,
        Address $address
    ): Response {
        abort_unless(
            (int) $address->user_id ===
                (int) $request->user()->id,
            403
        );

        $address->delete();

        return response()->noContent();
    }
}
