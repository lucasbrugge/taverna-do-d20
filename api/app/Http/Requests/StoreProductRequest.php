<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'required', 'integer', 'exists:categories,id',
            ],
            'name' => [
                'required', 'string', 'max:255',
            ],
            'description' => [
                'required', 'string', 'max:10000',
            ],
            'price' => [
                'required', 'numeric', 'min:0.01',
                'max:99999999.99', 'decimal:0,2',
            ],
            'stock' => [
                'required', 'integer', 'min:0',
            ],
            'is_active' => [
                'required', 'boolean',
            ],
            'image' => [
                'nullable', 'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ];
    }
}
